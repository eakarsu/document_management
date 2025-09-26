import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../../config/constants';
import { AuthenticatedRequest } from '../../middleware/authenticateToken';

const prisma = new PrismaClient();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          passwordHash: true,
          roleId: true,
          organizationId: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
          organizationId: user.organizationId,
          type: 'access'
        },
        JWT_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          type: 'refresh'
        },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
      );

      // Return user data and tokens
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        organizationId: user.organizationId
      };

      res.json({
        success: true,
        user: userData,
        accessToken,
        refreshToken
      });

    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, organizationName } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, first name, and last name are required'
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Find or create organization
      let organization;
      if (organizationName) {
        organization = await prisma.organization.findFirst({
          where: { name: organizationName }
        });
        if (!organization) {
          organization = await prisma.organization.create({
            data: {
              name: organizationName,
              domain: organizationName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.local'
            }
          });
        }
      } else {
        // Use default organization
        organization = await prisma.organization.findFirst();
        if (!organization) {
          organization = await prisma.organization.create({
            data: {
              name: 'Default Organization',
              domain: 'default.local'
            }
          });
        }
      }

      // Find default user role
      let userRole = await prisma.role.findFirst({
        where: {
          name: 'USER',
          organizationId: organization.id
        }
      });
      if (!userRole) {
        userRole = await prisma.role.create({
          data: {
            name: 'USER',
            organizationId: organization.id,
            permissions: ['documents:read', 'documents:write']
          }
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          firstName,
          lastName,
          roleId: userRole.id,
          organizationId: organization.id,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roleId: true,
          organizationId: true
        }
      });

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
          organizationId: user.organizationId,
          type: 'access'
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          type: 'refresh'
        },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
      );

      res.status(201).json({
        success: true,
        user,
        accessToken,
        refreshToken
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roleId: true,
          organizationId: true
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
          organizationId: user.organizationId,
          type: 'access'
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({
        success: true,
        accessToken,
        user
      });

    } catch (error: any) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      // In a real implementation, you'd blacklist the token
      // For now, we'll just return success
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roleId: true,
          organizationId: true,
          isActive: true,
          role: {
            select: {
              name: true,
              permissions: true
            }
          },
          organization: {
            select: {
              name: true,
              domain: true
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Add roleType based on role name
      const roleType = user.role?.name?.toUpperCase() || 'USER';

      res.json({
        success: true,
        user: {
          ...user,
          role: {
            ...user.role,
            roleType: roleType
          }
        }
      });
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  }
}

export const authController = new AuthController();