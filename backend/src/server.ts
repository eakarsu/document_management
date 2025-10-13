import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import expressWinston from 'express-winston';
import { config } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { BACKEND_PORT, FRONTEND_URL, ALLOWED_ORIGINS, RATE_LIMIT_CONFIG } from './config/constants';
import { setupRoutes } from './routes/setupRoutes';
import { setupGraphQL } from './graphql/setupGraphQL';

async function startServer() {
  try {
    const app = express();
    const httpServer = createServer(app);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          frameSrc: ["'self'", "http://localhost:4000", "https://localhost:4000"],
          frameAncestors: ["'self'", "http://localhost:3000", "https://localhost:3000", "http://localhost:3001", "https://localhost:3001", "http://localhost:3002", "https://localhost:3002"],
        },
      },
    }));

    // Rate limiting
    const limiter = rateLimit(RATE_LIMIT_CONFIG);
    app.use('/graphql', limiter);

    // CORS - Allow configured origins from environment variable
    app.use(cors({
      origin: ALLOWED_ORIGINS.includes(FRONTEND_URL) ? ALLOWED_ORIGINS : [...ALLOWED_ORIGINS, FRONTEND_URL],
      credentials: true,
    }));

    // Request logging
    app.use(expressWinston.logger({
      winstonInstance: logger,
      meta: true,
      msg: "HTTP {{req.method}} {{req.url}}",
      expressFormat: true,
      colorize: false,
    }));

    // Body parsing
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Cookie parsing - required for reading cookies in auth middleware
    app.use(cookieParser());

    // Setup all routes
    setupRoutes(app);

    // Setup GraphQL
    await setupGraphQL(app, httpServer);

    // Error handling middleware
    app.use(errorHandler);

    // Error logging
    app.use(expressWinston.errorLogger({
      winstonInstance: logger,
    }));

    const PORT = BACKEND_PORT;

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}`);
      logger.info(`🚀 GraphQL endpoint at http://localhost:${PORT}/graphql`);
      logger.info(`🚀 WebSocket server at ws://localhost:${PORT}/graphql`);
    });

  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

startServer();