import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Extend Request type to include user
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

// Middleware to check if user is admin
const isAdmin = async (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Check if user has admin role
  if (req.user.role?.name !== 'Administrator' && req.user.role?.name !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// GET /api/users - Get all users with pagination and search
router.get('/users', authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    // Build where clause for search and organization filter
    const baseWhere = {
      organizationId: req.user?.organizationId
    };

    const where = search ? {
      ...baseWhere,
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { department: { contains: search, mode: 'insensitive' as const } },
        { role: { name: { contains: search, mode: 'insensitive' as const } } }
      ]
    } : baseWhere;

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        department: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get stats (filtered by organization)
    const stats = await Promise.all([
      prisma.user.count({
        where: { organizationId: req.user?.organizationId }
      }),
      prisma.user.count({
        where: {
          organizationId: req.user?.organizationId,
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
          }
        }
      }),
      prisma.user.count({
        where: {
          organizationId: req.user?.organizationId,
          role: {
            name: { in: ['Administrator', 'Admin'] }
          }
        }
      }),
      prisma.role.count({
        where: { organizationId: req.user?.organizationId }
      })
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalUsers: stats[0],
        activeUsers: stats[1],
        administrators: stats[2],
        roleCount: stats[3]
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/users/:id', authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        roleId: true,
        department: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/users/:id', authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, roleId, roleName, department, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Build update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (department !== undefined) updateData.department = department;

    // Handle role update
    if (roleId !== undefined) {
      updateData.roleId = roleId;
    } else if (roleName !== undefined) {
      // Find role by name if roleName is provided instead of roleId
      const role = await prisma.role.findFirst({
        where: { name: roleName }
      });
      if (role) {
        updateData.roleId = role.id;
      }
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        roleId: true,
        department: true,
        createdAt: true,
        lastLogin: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/users - Create new user
router.post('/users', authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password, roleId, roleName, department } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine roleId
    let finalRoleId = roleId;
    if (!finalRoleId && roleName) {
      const role = await prisma.role.findFirst({
        where: { name: roleName }
      });
      if (role) {
        finalRoleId = role.id;
      }
    }

    // If no role specified, get default User role
    if (!finalRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'User' }
      });
      if (defaultRole) {
        finalRoleId = defaultRole.id;
      } else {
        // If no User role exists, get any role
        const anyRole = await prisma.role.findFirst();
        if (anyRole) {
          finalRoleId = anyRole.id;
        } else {
          return res.status(500).json({ error: 'No roles available in system' });
        }
      }
    }

    // Get organization ID (use first organization or create default)
    let organizationId: string;
    const org = await prisma.organization.findFirst();
    if (org) {
      organizationId = org.id;
    } else {
      const newOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          domain: 'default.org'
        }
      });
      organizationId = newOrg.id;
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        roleId: finalRoleId,
        organizationId,
        department: department || ''
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true
          }
        },
        roleId: true,
        department: true,
        createdAt: true,
        lastLogin: true
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/users/:id', authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/users/bulk-delete - Delete multiple users
router.post('/users/bulk-delete', authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided' });
    }

    // Filter out the current user's ID to prevent self-deletion
    const idsToDelete = userIds.filter(id => id !== req.user?.id);

    if (idsToDelete.length === 0) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete users in bulk
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: { in: idsToDelete },
        organizationId: req.user?.organizationId // Only delete users from same organization
      }
    });

    res.json({
      message: `Successfully deleted ${deleteResult.count} user(s)`,
      deletedCount: deleteResult.count,
      skippedCount: userIds.length - idsToDelete.length
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// GET /api/roles - Get available roles
router.get('/roles', authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get all roles from database
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        userCount: r._count.users
      }))
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

export default router;