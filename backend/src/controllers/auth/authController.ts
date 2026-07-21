import { Request, Response } from 'express';
import { AuthService } from '../../services/AuthService';
import { AuthenticatedRequest } from '../../middleware/authenticateToken';

const auth = new AuthService();
const secure = process.env.NODE_ENV === 'production';
const cookieBase = { httpOnly: true, secure, sameSite: 'strict' as const, path: '/' };

function clientIdentity(req: Request) {
  return { ip: req.ip || req.socket.remoteAddress || 'unknown', userAgent: String(req.headers['user-agent'] || 'unknown') };
}

function setSessionCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('accessToken', tokens.accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, { ...cookieBase, maxAge: 8 * 60 * 60 * 1000 });
}

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password, mfaCode } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });
    const client = clientIdentity(req);
    const result = await auth.login(String(email), String(password), client.ip, client.userAgent, mfaCode ? String(mfaCode) : undefined);
    if (!result.success) return res.status(401).json(result);
    setSessionCookies(res, result);
    return res.json({ success: true, user: result.user });
  }

  async oidcState(req: Request, res: Response) {
    const domain = String(req.body?.organizationDomain || '');
    if (!domain) return res.status(400).json({ error: 'organizationDomain is required' });
    const result = auth.issueOidcState(domain);
    res.cookie('oidcState', result.state, { ...cookieBase, maxAge: 10 * 60 * 1000 });
    return res.json({ nonce: result.nonce });
  }

  async oidcCallback(req: Request, res: Response) {
    try {
      const organizationDomain = String(req.body?.organizationDomain || '');
      const idToken = String(req.body?.idToken || '');
      const state = String(req.cookies?.oidcState || '');
      if (!organizationDomain || !idToken || !state) return res.status(400).json({ error: 'OIDC callback fields are required' });
      const client = clientIdentity(req);
      const result = await auth.loginOidc(organizationDomain, idToken, state, client.ip, client.userAgent);
      setSessionCookies(res, result);
      res.clearCookie('oidcState', cookieBase);
      return res.json({ success: true, user: result.user });
    } catch (error) { return res.status(401).json({ success: false, error: error instanceof Error ? error.message : 'OIDC_LOGIN_FAILED' }); }
  }

  async register(_req: Request, res: Response) {
    return res.status(403).json({ success: false, error: 'SELF_REGISTRATION_DISABLED' });
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh cookie required' });
    const result = await auth.refreshToken(token);
    if (!result.accessToken || !result.refreshToken) return res.status(401).json({ error: result.error });
    setSessionCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return res.json({ success: true, user: result.user });
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    if (req.user) await auth.logout(req.user.id, req.user.sessionId);
    res.clearCookie('accessToken', cookieBase);
    res.clearCookie('refreshToken', cookieBase);
    return res.json({ success: true });
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    return res.json({ success: true, user: req.user });
  }
}

export const authController = new AuthController();
