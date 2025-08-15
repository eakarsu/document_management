import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const router = express.Router();
const prisma = new PrismaClient();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'healthy',
        database: 'unknown',
        redis: 'unknown',
        storage: 'unknown'
      }
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Check Redis connection
    try {
      const redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await redis.connect();
      await redis.ping();
      await redis.disconnect();
      healthCheck.services.redis = 'healthy';
    } catch (error) {
      healthCheck.services.redis = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // TODO: Check MinIO/storage connection
    healthCheck.services.storage = 'healthy'; // Placeholder

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const detailed = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      services: {
        api: { status: 'healthy', responseTime: 0 },
        database: { status: 'unknown', responseTime: 0, error: undefined as string | undefined },
        redis: { status: 'unknown', responseTime: 0, error: undefined as string | undefined },
        storage: { status: 'unknown', responseTime: 0, error: undefined as string | undefined }
      }
    };

    // Check database with timing
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      detailed.services.database = {
        status: 'healthy',
        responseTime: Date.now() - start,
        error: undefined
      };
    } catch (error) {
      detailed.services.database = {
        status: 'unhealthy',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      detailed.status = 'degraded';
    }

    // Check Redis with timing
    try {
      const start = Date.now();
      const redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await redis.connect();
      await redis.ping();
      await redis.disconnect();
      detailed.services.redis = {
        status: 'healthy',
        responseTime: Date.now() - start,
        error: undefined
      };
    } catch (error) {
      detailed.services.redis = {
        status: 'unhealthy',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      detailed.status = 'degraded';
    }

    const statusCode = detailed.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailed);

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are available
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as healthRouter };