import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
// @ts-ignore — amqplib has no bundled types; install @types/amqplib to remove this
import amqp from 'amqplib';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

type ServiceStatus = 'up' | 'degraded' | 'down';

interface ServiceResult {
  status: ServiceStatus;
  responseTime?: number;
  error?: string;
  detail?: string;
}

/** Check PostgreSQL via Prisma */
async function checkDatabase(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'up', responseTime: Date.now() - start };
  } catch (err: any) {
    return { status: 'down', responseTime: Date.now() - start, error: err.message };
  }
}

/** Check Redis */
async function checkRedis(): Promise<ServiceResult> {
  const start = Date.now();
  let redis: ReturnType<typeof createClient> | null = null;
  try {
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    // Add a short connection timeout
    const connectPromise = redis.connect();
    await Promise.race([
      connectPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connect timeout')), 3000))
    ]);
    await redis.ping();
    return { status: 'up', responseTime: Date.now() - start };
  } catch (err: any) {
    return { status: 'down', responseTime: Date.now() - start, error: err.message };
  } finally {
    try { await redis?.disconnect(); } catch (_) { /* ignore */ }
  }
}

/** Check Elasticsearch */
async function checkElasticsearch(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const es = new ElasticsearchClient({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      requestTimeout: 3000
    } as any);
    const info = await Promise.race([
      es.cluster.health({ timeout: '2s' } as any),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ES health timeout')), 4000))
    ]) as any;
    const clusterStatus = info?.status || 'unknown';
    return {
      status: clusterStatus === 'red' ? 'degraded' : 'up',
      responseTime: Date.now() - start,
      detail: `cluster status: ${clusterStatus}`
    };
  } catch (err: any) {
    return { status: 'down', responseTime: Date.now() - start, error: err.message };
  }
}

/** Check MinIO / local filesystem storage */
async function checkStorage(): Promise<ServiceResult> {
  const start = Date.now();
  // Try MinIO if env var is set, fall back to filesystem check
  const minioEndpoint = process.env.MINIO_ENDPOINT;
  if (minioEndpoint) {
    try {
      const http = await import('http');
      await new Promise<void>((resolve, reject) => {
        const req = http.default.request(
          { hostname: minioEndpoint.replace(/^https?:\/\//, '').split(':')[0],
            port: parseInt(process.env.MINIO_PORT || '9000'),
            path: '/minio/health/live',
            method: 'GET',
            timeout: 3000 },
          (res) => {
            if (res.statusCode === 200) resolve();
            else reject(new Error(`MinIO health returned ${res.statusCode}`));
          }
        );
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('MinIO health timeout')));
        req.end();
      });
      return { status: 'up', responseTime: Date.now() - start, detail: 'minio' };
    } catch (err: any) {
      return { status: 'down', responseTime: Date.now() - start, error: err.message, detail: 'minio' };
    }
  }

  // Fallback: check local uploads directory is writable
  try {
    const uploadsDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const testFile = path.join(uploadsDir, '.health-check');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return { status: 'up', responseTime: Date.now() - start, detail: 'local-filesystem' };
  } catch (err: any) {
    return { status: 'down', responseTime: Date.now() - start, error: err.message, detail: 'local-filesystem' };
  }
}

/** Check RabbitMQ */
async function checkRabbitMQ(): Promise<ServiceResult> {
  const start = Date.now();
  let connection: amqp.Connection | null = null;
  try {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await Promise.race([
      amqp.connect(rabbitmqUrl),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('RabbitMQ connect timeout')), 4000)
      )
    ]) as amqp.Connection;
    return { status: 'up', responseTime: Date.now() - start };
  } catch (err: any) {
    return { status: 'down', responseTime: Date.now() - start, error: err.message };
  } finally {
    try { await (connection as any)?.close(); } catch (_) { /* ignore */ }
  }
}

function overallStatus(services: Record<string, ServiceResult>): ServiceStatus {
  const statuses = Object.values(services).map(s => s.status);
  if (statuses.every(s => s === 'up')) return 'up';
  if (statuses.some(s => s === 'down')) return 'degraded';
  return 'degraded';
}

// Basic health check
router.get('/', async (req, res) => {
  try {
    const [database, redis, elasticsearch, storage, rabbitmq] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkElasticsearch(),
      checkStorage(),
      checkRabbitMQ()
    ]);

    const services = { database, redis, elasticsearch, storage, rabbitmq };
    const status = overallStatus(services);

    const healthCheck = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: { status: 'up' as ServiceStatus },
        database: { status: database.status },
        redis: { status: redis.status },
        elasticsearch: { status: elasticsearch.status },
        storage: { status: storage.status },
        rabbitmq: { status: rabbitmq.status }
      }
    };

    const statusCode = status === 'up' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error: any) {
    res.status(500).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const [database, redis, elasticsearch, storage, rabbitmq] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkElasticsearch(),
      checkStorage(),
      checkRabbitMQ()
    ]);

    const services = { database, redis, elasticsearch, storage, rabbitmq };
    const status = overallStatus(services);

    const detailed = {
      status,
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
        api: { status: 'up' as ServiceStatus, responseTime: 0 },
        database,
        redis,
        elasticsearch,
        storage,
        rabbitmq
      }
    };

    const statusCode = status === 'up' ? 200 : 503;
    res.status(statusCode).json(detailed);

  } catch (error: any) {
    res.status(500).json({
      status: 'down',
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

  } catch (error: any) {
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