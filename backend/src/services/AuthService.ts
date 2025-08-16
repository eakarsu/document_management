import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import winston from 'winston';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
  organization: {
    id: string;
    name: string;
    domain: string;
  };
  organizationId: string;
}

interface LoginResult {
  success: boolean;
  user?: UserData;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId?: string;
}

export class AuthService {
  private prisma: PrismaClient;
  private redis: any;
  private logger: winston.Logger;
  private jwtSecret: string;
  private jwtRefreshSecret: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console()
      ]
    });
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    
    // Connect to Redis - with proper error handling
    this.initRedis();
  }
  
  private async initRedis() {
    try {
      await this.redis.connect();
      this.logger.info('Redis connected successfully');
    } catch (error) {
      this.logger.error('Redis connection failed:', error);
      // Continue without Redis for now
    }
  }

  async login(email: string, password: string, ipAddress: string, userAgent: string): Promise<LoginResult> {
    try {
      // Find user with role and organization
      const user = await this.prisma.user.findUnique({
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        },
        include: {
          role: {
            include: {
              organization: true
            }
          },
          organization: true
        }
      });

      if (!user) {
        this.logger.warn('Login attempt with invalid email', { email, ipAddress });
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        this.logger.warn('Login attempt with invalid password', { email, ipAddress });
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if account is verified
      if (!user.emailVerified) {
        return {
          success: false,
          error: 'Please verify your email address before logging in'
        };
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Create session
      await this.createSession(user.id, accessToken, ipAddress, userAgent);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      this.logger.info('User logged in successfully', { 
        userId: user.id, 
        email: user.email,
        ipAddress 
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            id: user.role.id,
            name: user.role.name,
            permissions: user.role.permissions
          },
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            domain: user.organization.domain
          },
          organizationId: user.organizationId
        },
        accessToken,
        refreshToken
      };

    } catch (error) {
      this.logger.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  }

  async register(userData: RegisterData): Promise<LoginResult> {
    try {
      console.log('🔄 AuthService.register() called with:', { email: userData.email, orgId: userData.organizationId });
      
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() }
      });

      if (existingUser) {
        console.log('❌ User already exists:', userData.email);
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      console.log('✅ User does not exist, proceeding with registration...');

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);
      console.log('✅ Password hashed successfully');

      // Get default role if not specified
      let roleId = userData.roleId;
      if (!roleId) {
        console.log('🔍 Looking for default User role in organization:', userData.organizationId);
        const defaultRole = await this.prisma.role.findFirst({
          where: {
            organizationId: userData.organizationId,
            name: 'User'
          }
        });
        console.log('🔍 Found default role:', defaultRole?.id, defaultRole?.name);
        roleId = defaultRole?.id;
      }

      if (!roleId) {
        console.log('❌ No valid role found');
        return {
          success: false,
          error: 'Invalid role specified'
        };
      }

      console.log('✅ Using role ID:', roleId);

      // Create user
      const newUser = await this.prisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          organizationId: userData.organizationId,
          roleId,
          emailVerified: false // Require email verification
        },
        include: {
          role: true,
          organization: true
        }
      });

      // Generate verification token
      const verificationToken = this.generateVerificationToken(newUser.id);
      try {
        await this.redis.setEx(`email_verification:${newUser.id}`, 24 * 60 * 60, verificationToken);
      } catch (redisError) {
        this.logger.warn('Redis setEx failed, continuing without email verification cache:', redisError);
      }

      // TODO: Send verification email

      this.logger.info('User registered successfully', { 
        userId: newUser.id, 
        email: newUser.email 
      });

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: {
            id: newUser.role.id,
            name: newUser.role.name,
            permissions: newUser.role.permissions
          },
          organization: {
            id: newUser.organization.id,
            name: newUser.organization.name,
            domain: newUser.organization.domain
          },
          organizationId: newUser.organizationId
        }
      };

    } catch (error) {
      console.error('❌ Registration error details:', error);
      this.logger.error('Registration error:', error);
      return {
        success: false,
        error: 'An error occurred during registration'
      };
    }
  }

  async logout(userId: string, sessionId?: string): Promise<boolean> {
    try {
      // Invalidate specific session or all sessions for user
      if (sessionId) {
        await this.prisma.userSession.updateMany({
          where: { 
            userId,
            sessionId,
            isActive: true 
          },
          data: { isActive: false }
        });
        
        // Remove from Redis
        try {
          await this.redis.del(`session:${sessionId}`);
        } catch (redisError) {
          this.logger.warn('Redis del failed:', redisError);
        }
      } else {
        // Invalidate all sessions
        await this.prisma.userSession.updateMany({
          where: { 
            userId,
            isActive: true 
          },
          data: { isActive: false }
        });
        
        // Remove all sessions from Redis
        const sessions = await this.prisma.userSession.findMany({
          where: { userId },
          select: { sessionId: true }
        });
        
        for (const session of sessions) {
          try {
            await this.redis.del(`session:${session.sessionId}`);
          } catch (redisError) {
            this.logger.warn('Redis del failed:', redisError);
          }
        }
      }

      this.logger.info('User logged out', { userId, sessionId });
      return true;

    } catch (error) {
      this.logger.error('Logout error:', error);
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken?: string; error?: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;
      
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true 
        },
        include: {
          role: true
        }
      });

      if (!user) {
        return { error: 'Invalid refresh token' };
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return { accessToken };

    } catch (error) {
      this.logger.error('Token refresh error:', error);
      return { error: 'Invalid refresh token' };
    }
  }

  async verifyToken(token: string): Promise<UserData | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Check if token is blacklisted
      let isBlacklisted = false;
      try {
        const result = await this.redis.get(`blacklist:${token}`);
        isBlacklisted = !!result;
      } catch (redisError) {
        this.logger.warn('Redis get failed:', redisError);
      }
      if (isBlacklisted) {
        return null;
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true 
        },
        include: {
          role: true,
          organization: true
        }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.permissions
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          domain: user.organization.domain
        },
        organizationId: user.organizationId
      };

    } catch (error) {
      return null;
    }
  }

  private generateAccessToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        organizationId: user.organizationId
      },
      this.jwtSecret,
      { 
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h',
        issuer: 'dms-api',
        audience: 'dms-client'
      } as jwt.SignOptions
    );
  }

  private generateRefreshToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      this.jwtRefreshSecret,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'dms-api',
        audience: 'dms-client'
      } as jwt.SignOptions
    );
  }

  private generateVerificationToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'verification' },
      this.jwtSecret,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h' } as jwt.SignOptions
    );
  }

  private async createSession(
    userId: string, 
    token: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<void> {
    const decoded = jwt.decode(token) as any;
    const sessionId = `session_${userId}_${Date.now()}`;
    
    // Store in database
    await this.prisma.userSession.create({
      data: {
        sessionId,
        userId,
        ipAddress,
        userAgent,
        expiresAt: new Date(decoded.exp * 1000)
      }
    });

    // Store in Redis for quick lookup
    try {
      await this.redis.setEx(
        `session:${sessionId}`,
        15 * 60, // 15 minutes
        JSON.stringify({
          userId,
          token,
          ipAddress,
          userAgent
        })
      );
    } catch (redisError) {
      this.logger.warn('Redis setEx for session failed:', redisError);
    }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      });

      if (!user || !user.role) {
        return false;
      }

      return user.role.permissions.includes(permission) || user.role.permissions.includes('*');

    } catch (error) {
      this.logger.error('Permission check error:', error);
      return false;
    }
  }

  async getActiveSessionsCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.userSession.count({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      return count;

    } catch (error) {
      this.logger.error('Session count error:', error);
      return 0;
    }
  }
}