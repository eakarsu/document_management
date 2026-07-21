import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_SECRET } from '../config/constants';
import { verifyTotp } from '../security/mfa';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  clearanceLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  accessAttributes: unknown;
  role: { id: string; name: string; permissions: string[] };
  organization: { id: string; name: string; domain: string };
  sessionId: string;
  permissions: string[];
}

interface TokenClaims { userId: string; organizationId: string; sid: string; type: 'access' | 'refresh'; iat: number; exp: number }
const issuer = 'dms-api';
const audience = 'dms-client';
const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export class AuthService {
  constructor(private prisma = new PrismaClient()) {}

  private policyDefaults(policy: any) {
    return {
      requireSso: policy?.requireSso ?? false,
      requireMfa: policy?.requireMfa ?? true,
      accessTokenMinutes: Math.max(5, Math.min(30, policy?.accessTokenMinutes ?? 15)),
      idleTimeoutMinutes: Math.max(5, Math.min(60, policy?.idleTimeoutMinutes ?? 15)),
      absoluteSessionHours: Math.max(1, Math.min(24, policy?.absoluteSessionHours ?? 8)),
      maxActiveSessions: Math.max(1, Math.min(10, policy?.maxActiveSessions ?? 3)),
    };
  }

  private userData(user: any, sessionId: string): AuthenticatedUser {
    return {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
      organizationId: user.organizationId, clearanceLevel: user.clearanceLevel, accessAttributes: user.accessAttributes,
      role: { id: user.role.id, name: user.role.name, permissions: user.role.permissions },
      permissions: user.role.permissions,
      organization: { id: user.organization.id, name: user.organization.name, domain: user.organization.domain },
      sessionId,
    };
  }

  private signAccess(user: any, sid: string, minutes: number) {
    return jwt.sign({ userId: user.id, organizationId: user.organizationId, sid, type: 'access' }, JWT_SECRET, { expiresIn: `${minutes}m`, issuer, audience } as jwt.SignOptions);
  }

  private signRefresh(user: any, sid: string) {
    return jwt.sign({ userId: user.id, organizationId: user.organizationId, sid, type: 'refresh', jti: crypto.randomUUID() }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN, issuer, audience } as jwt.SignOptions);
  }

  private async beginSession(user: any, policyInput: any, ipAddress: string, userAgent: string, authMethod: string, mfaVerified: boolean) {
    const policy = this.policyDefaults(policyInput);
    const active = await this.prisma.userSession.findMany({ where: { userId: user.id, isActive: true, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: 'asc' } });
    if (active.length >= policy.maxActiveSessions) {
      await this.prisma.userSession.updateMany({ where: { id: { in: active.slice(0, active.length - policy.maxActiveSessions + 1).map(item => item.id) } }, data: { isActive: false } });
    }
    const sid = crypto.randomUUID();
    const refreshToken = this.signRefresh(user, sid);
    await this.prisma.userSession.create({ data: {
      sessionId: sid, userId: user.id, ipAddress: ipAddress.slice(0, 128), userAgent: userAgent.slice(0, 512), authMethod,
      refreshTokenHash: digest(refreshToken), mfaVerifiedAt: mfaVerified ? new Date() : null,
      expiresAt: new Date(Date.now() + policy.absoluteSessionHours * 3_600_000),
    } });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    return { user: this.userData(user, sid), accessToken: this.signAccess(user, sid, policy.accessTokenMinutes), refreshToken };
  }

  async login(email: string, password: string, ipAddress: string, userAgent: string, mfaCode?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase(), isActive: true }, include: { role: true, organization: { include: { authPolicy: true } } } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { success: false as const, error: 'Invalid email or password' };
    if (!user.emailVerified) return { success: false as const, error: 'Email verification required' };
    const policy = this.policyDefaults(user.organization.authPolicy);
    if (policy.requireSso) return { success: false as const, error: 'SSO_REQUIRED' };
    if (policy.requireMfa && (!user.mfaEnabled || !user.mfaSecret || !mfaCode || !verifyTotp(user.mfaSecret, mfaCode))) return { success: false as const, error: 'MFA_REQUIRED_OR_INVALID' };
    return { success: true as const, ...(await this.beginSession(user, user.organization.authPolicy, ipAddress, userAgent, 'password', policy.requireMfa)) };
  }

  issueOidcState(organizationDomain: string) {
    const nonce = crypto.randomBytes(24).toString('base64url');
    const state = jwt.sign({ type: 'oidc_state', organizationDomain, nonce }, JWT_SECRET, { expiresIn: '10m', issuer, audience } as jwt.SignOptions);
    return { state, nonce };
  }

  private async oidcClaims(idToken: string, policy: any, state: string) {
    if (!policy.oidcIssuer || !policy.oidcClientId || !policy.oidcJwksUri) throw new Error('OIDC_POLICY_INCOMPLETE');
    const stateClaims = jwt.verify(state, JWT_SECRET, { issuer, audience }) as any;
    if (stateClaims.type !== 'oidc_state') throw new Error('OIDC_STATE_INVALID');
    const header = jwt.decode(idToken, { complete: true })?.header;
    if (!header?.kid || header.alg !== 'RS256') throw new Error('OIDC_ALGORITHM_REJECTED');
    const jwks = await fetch(policy.oidcJwksUri, { headers: { accept: 'application/json' } });
    if (!jwks.ok) throw new Error('OIDC_JWKS_UNAVAILABLE');
    const key = ((await jwks.json()) as { keys?: any[] }).keys?.find(item => item.kid === header.kid && item.kty === 'RSA');
    if (!key) throw new Error('OIDC_KEY_NOT_FOUND');
    const publicKey = crypto.createPublicKey({ key: key as crypto.JsonWebKey, format: 'jwk' });
    const claims = jwt.verify(idToken, publicKey, { algorithms: ['RS256'], issuer: policy.oidcIssuer, audience: policy.oidcClientId, clockTolerance: 5 }) as any;
    if (!claims.sub || claims.nonce !== stateClaims.nonce) throw new Error('OIDC_NONCE_INVALID');
    return { claims, stateClaims };
  }

  async loginOidc(organizationDomain: string, idToken: string, state: string, ipAddress: string, userAgent: string) {
    const organization = await this.prisma.organization.findUnique({ where: { domain: organizationDomain }, include: { authPolicy: true } });
    if (!organization?.isActive || !organization.authPolicy) throw new Error('OIDC_ORGANIZATION_NOT_FOUND');
    const { claims, stateClaims } = await this.oidcClaims(idToken, organization.authPolicy, state);
    if (stateClaims.organizationDomain !== organizationDomain) throw new Error('OIDC_ORGANIZATION_MISMATCH');
    const identity = await this.prisma.externalIdentity.findFirst({ where: { issuer: claims.iss, subject: claims.sub, organizationId: organization.id }, include: { user: { include: { role: true, organization: true } } } });
    if (!identity?.user.isActive) throw new Error('OIDC_IDENTITY_NOT_PROVISIONED');
    const amr = Array.isArray(claims.amr) ? claims.amr : [];
    const mfaVerified = amr.some((value: string) => ['mfa', 'otp', 'hwk'].includes(value));
    if (this.policyDefaults(organization.authPolicy).requireMfa && !mfaVerified) throw new Error('OIDC_MFA_REQUIRED');
    await this.prisma.externalIdentity.update({ where: { id: identity.id }, data: { lastAuthenticatedAt: new Date() } });
    return { success: true as const, ...(await this.beginSession(identity.user, organization.authPolicy, ipAddress, userAgent, 'oidc', mfaVerified)) };
  }

  async refreshToken(refreshToken: string) {
    try {
      const claims = jwt.verify(refreshToken, JWT_REFRESH_SECRET, { issuer, audience }) as TokenClaims;
      if (claims.type !== 'refresh') return { error: 'INVALID_REFRESH_TOKEN' };
      const session = await this.prisma.userSession.findFirst({ where: { sessionId: claims.sid, userId: claims.userId, isActive: true, expiresAt: { gt: new Date() } }, include: { user: { include: { role: true, organization: { include: { authPolicy: true } } } } } });
      if (!session?.user.isActive) return { error: 'SESSION_EXPIRED' };
      const suppliedHash = Buffer.from(digest(refreshToken), 'hex');
      const storedHash = Buffer.from(session.refreshTokenHash, 'hex');
      if (suppliedHash.length !== storedHash.length || !crypto.timingSafeEqual(suppliedHash, storedHash)) {
        await this.prisma.userSession.update({ where: { id: session.id }, data: { isActive: false } });
        return { error: 'REFRESH_TOKEN_REUSE_DETECTED' };
      }
      const policy = this.policyDefaults(session.user.organization.authPolicy);
      if (session.lastSeenAt < new Date(Date.now() - policy.idleTimeoutMinutes * 60_000)) { await this.prisma.userSession.update({ where: { id: session.id }, data: { isActive: false } }); return { error: 'SESSION_IDLE_TIMEOUT' }; }
      const rotated = this.signRefresh(session.user, session.sessionId);
      await this.prisma.userSession.update({ where: { id: session.id }, data: { refreshTokenHash: digest(rotated), lastSeenAt: new Date() } });
      return { accessToken: this.signAccess(session.user, session.sessionId, policy.accessTokenMinutes), refreshToken: rotated, user: this.userData(session.user, session.sessionId) };
    } catch { return { error: 'INVALID_REFRESH_TOKEN' }; }
  }

  async verifyToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const claims = jwt.verify(token, JWT_SECRET, { issuer, audience }) as TokenClaims;
      if (claims.type !== 'access') return null;
      const session = await this.prisma.userSession.findFirst({ where: { sessionId: claims.sid, userId: claims.userId, isActive: true, expiresAt: { gt: new Date() } }, include: { user: { include: { role: true, organization: { include: { authPolicy: true } } } } } });
      if (!session?.user.isActive || session.user.organizationId !== claims.organizationId) return null;
      const policy = this.policyDefaults(session.user.organization.authPolicy);
      if (session.lastSeenAt < new Date(Date.now() - policy.idleTimeoutMinutes * 60_000)) { await this.prisma.userSession.update({ where: { id: session.id }, data: { isActive: false } }); return null; }
      await this.prisma.userSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
      return this.userData(session.user, session.sessionId);
    } catch { return null; }
  }

  async logout(userId: string, sessionId?: string) {
    await this.prisma.userSession.updateMany({ where: { userId, ...(sessionId && { sessionId }) }, data: { isActive: false } });
    return true;
  }

  async hasPermission(userId: string, permission: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    return Boolean(user?.isActive && (user.role.permissions.includes(permission) || user.role.permissions.includes('*')));
  }
}
