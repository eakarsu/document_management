import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
// @ts-ignore — amqplib has no bundled types; install @types/amqplib to remove this
import amqp from 'amqplib';
import { StorageService } from '../services/StorageService';

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

/** Check required encrypted object storage; there is no filesystem fallback. */
async function checkStorage(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const available = await new StorageService().healthCheck();
    if (!available) throw new Error('Object bucket unavailable');
    return { status: 'up', responseTime: Date.now() - start, detail: 'encrypted-object-storage' };
  } catch (err: any) {
    return { status: 'down', responseTime: Date.now() - start, error: err.message, detail: 'encrypted-object-storage' };
  }
}

async function checkMalwareScanner(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const url = process.env.MALWARE_SCANNER_HEALTH_URL || process.env.MALWARE_SCANNER_URL;
    if (!url) throw new Error('Malware scanner URL is not configured');
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`Scanner health returned ${response.status}`);
    return { status: 'up', responseTime: Date.now() - start };
  } catch (err: any) {
    return { status: 'down', responseTime: Date.now() - start, error: err.message };
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
    const [database, storage, malwareScanner] = await Promise.all([checkDatabase(), checkStorage(), checkMalwareScanner()]);
    if ([database, storage, malwareScanner].some(service => service.status !== 'up')) {
      return res.status(503).json({ status: 'not_ready', timestamp: new Date().toISOString(), services: { database, storage, malwareScanner } });
    }
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: { database, storage, malwareScanner }
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
