import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser, AuthService } from '../services/AuthService';

const auth = new AuthService();
export interface AuthenticatedRequest extends Request { user?: any }

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = bearer && !['null', 'undefined'].includes(bearer) ? bearer : req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'Access token required' });
  const user = await auth.verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid, expired, or inactive session' });
  req.user = user;
  next();
};
