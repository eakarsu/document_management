import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Database configuration
export const config = {
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://dms_user:dms_password@localhost:5432/dms_metadata',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    timeout: parseInt(process.env.DB_TIMEOUT || '30000')
  },
  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://dms_user:dms_password@localhost:27017/dms_documents',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT || '5000')
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    }
  }
};

// Global clients
let prismaClient: PrismaClient | null = null;
let mongoClient: MongoClient | null = null;
let redisClient: any = null;

// Initialize Prisma client
export const getPrismaClient = (): PrismaClient => {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: config.postgres.url
        }
      },
      log: [
        {
          emit: 'event',
          level: 'query'
        },
        {
          emit: 'event',
          level: 'error'
        },
        {
          emit: 'event',
          level: 'info'
        },
        {
          emit: 'event',
          level: 'warn'
        }
      ]
    });

    // Log database events in development
    if (process.env.NODE_ENV === 'development') {
      prismaClient.$on('query', (e) => {
        logger.info('Prisma Query:', {
          query: e.query,
          params: e.params,
          duration: e.duration + 'ms'
        });
      });
    }

    prismaClient.$on('error', (e) => {
      logger.error('Prisma Error:', e);
    });

    prismaClient.$on('warn', (e) => {
      logger.warn('Prisma Warning:', e);
    });

    prismaClient.$on('info', (e) => {
      logger.info('Prisma Info:', e);
    });
  }

  return prismaClient;
};

// Initialize MongoDB client
export const getMongoClient = async (): Promise<MongoClient> => {
  if (!mongoClient) {
    mongoClient = new MongoClient(config.mongodb.url, config.mongodb.options);
    
    await mongoClient.connect();
    
    // Test connection
    await mongoClient.db().admin().ping();
    logger.info('MongoDB connected successfully');

    // Handle connection events
    mongoClient.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoClient.on('close', () => {
      logger.info('MongoDB connection closed');
    });

    mongoClient.on('reconnect', () => {
      logger.info('MongoDB reconnected');
    });
  }

  return mongoClient;
};

// Initialize Redis client
export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient(config.redis);
    
    redisClient.on('error', (error: Error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    await redisClient.connect();
  }

  return redisClient;
};

// Database health checks
export const checkDatabaseHealth = async () => {
  const health = {
    postgres: false,
    mongodb: false,
    redis: false
  };

  try {
    // Check Prisma/PostgreSQL
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    health.postgres = true;
  } catch (error) {
    logger.error('PostgreSQL health check failed:', error);
  }

  try {
    // Check MongoDB
    const mongo = await getMongoClient();
    await mongo.db().admin().ping();
    health.mongodb = true;
  } catch (error) {
    logger.error('MongoDB health check failed:', error);
  }

  try {
    // Check Redis
    const redis = await getRedisClient();
    await redis.ping();
    health.redis = true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }

  return health;
};

// Cleanup function for graceful shutdown
export const closeConnections = async () => {
  logger.info('Closing database connections...');

  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    logger.info('Prisma client disconnected');
  }

  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    logger.info('MongoDB client disconnected');
  }

  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    logger.info('Redis client disconnected');
  }
};

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connections...');
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections...');
  await closeConnections();
  process.exit(0);
});

// Initialize databases on module load
export const initializeDatabases = async () => {
  try {
    logger.info('Initializing database connections...');
    
    // Initialize all clients
    const prisma = getPrismaClient();
    const mongo = await getMongoClient();
    const redis = await getRedisClient();

    // Test all connections
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      mongo.db().admin().ping(),
      redis.ping()
    ]);

    logger.info('All database connections initialized successfully');
    
    return {
      prisma,
      mongo,
      redis
    };

  } catch (error) {
    logger.error('Failed to initialize databases:', error);
    throw error;
  }
};