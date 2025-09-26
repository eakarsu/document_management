import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    organizationId: string;
  };
}

const authService = new AuthService();

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Received Bearer token:', token.substring(0, 20) + '...');
    } else {
      console.log('No Authorization header or invalid format. Headers:', JSON.stringify(req.headers, null, 2));
    }

    // If no header token, try query parameter for iframe/image requests
    if (!token && req.query.token) {
      token = req.query.token as string;
      console.log('Using query parameter token for document view:', token.substring(0, 20) + '...');
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify token
    const user = await authService.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const hasPermission = await authService.hasPermission(req.user.id, permission);

      if (!hasPermission) {
        return res.status(403).json({
          error: `Permission '${permission}' required`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();

    } catch (error: any) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error during permission check',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

export const requireRole = (roleName: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (req.user.role.name !== roleName && req.user.role.name !== 'Admin') {
      return res.status(403).json({
        error: `Role '${roleName}' required`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

export const requireOrganization = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Extract organization ID from request (could be in params, body, or query)
  const requestedOrgId = req.params.organizationId || 
                        req.body?.organizationId || 
                        req.query.organizationId;

  if (requestedOrgId && req.user.organizationId !== requestedOrgId) {
    return res.status(403).json({
      error: 'Access to this organization is not allowed',
      code: 'ORGANIZATION_ACCESS_DENIED'
    });
  }

  next();
};

// Optional auth middleware - doesn't fail if no token provided
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const user = await authService.verifyToken(token);
        if (user) {
          req.user = user;
        }
      }
    }

    next();

  } catch (error: any) {
    // Continue without authentication on error
    next();
  }
};

// GraphQL auth middleware - allows public operations
export const graphqlAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract GraphQL operation from request body
    const { query, operationName } = req.body || {};
    
    // Define public operations that don't require authentication
    const publicOperations = [
      'register',
      'login',
      'refreshToken',
      'IntrospectionQuery',
      '__schema'
    ];
    
    // Check if this is a public operation
    const isPublicOperation = publicOperations.some(op => {
      return query?.includes(op) || operationName === op;
    });
    
    // If it's an introspection query, allow it
    if (query && (query.includes('__schema') || query.includes('__type'))) {
      return next();
    }
    
    // If it's a public operation, don't require auth
    if (isPublicOperation) {
      return next();
    }
    
    // For all other operations, require authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Invalid authorization header format',
        code: 'INVALID_HEADER'
      });
    }

    // Verify token
    const user = await authService.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error: any) {
    console.error('GraphQL auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};