import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * Development-only endpoint to generate auth tokens for scripts
 * WARNING: Only enable this in development environment
 */
router.get('/dev-token', (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Create a test user token for header generation
  const testUser = {
    id: 'dev-user-001',
    email: 'dev@headers.local',
    firstName: 'Dev',
    lastName: 'User',
    organizationId: 'org-001',
    role: {
      name: 'Admin',
      permissions: ['all']
    }
  };

  // Generate token (valid for 1 hour). Fail closed: never fall back to a
  // hard-coded secret.
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: 'JWT_SECRET must be configured with at least 32 characters' });
  }
  const token = jwt.sign(
    testUser,
    secret,
    { expiresIn: '1h' }
  );

  res.json({
    success: true,
    token,
    user: testUser,
    message: 'Development token generated (valid for 1 hour)'
  });
});

export default router;