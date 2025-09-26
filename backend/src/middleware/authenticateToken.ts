import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET } from '../config/constants';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Try to get token from Authorization header first, then from query parameters
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no header token, try query parameter for iframe/image requests
  if (!token && req.query.token) {
    token = req.query.token as string;
    console.log('Using query parameter token:', token.substring(0, 20) + '...');
  }

  if (!token) {
    console.log('No token found in headers or query parameters');
    return res.status(401).json({ error: 'Access token required' });
  }

  console.log('Token found, proceeding with verification...');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        roleId: true,
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};