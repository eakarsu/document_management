import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import expressWinston from 'express-winston';
import { config } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { BACKEND_PORT, FRONTEND_URL, RATE_LIMIT_CONFIG } from './config/constants';
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

    // CORS - Allow both Next.js (3000) and Vite (3001, 3002, 3003) frontends
    app.use(cors({
      origin: [
        'http://localhost:3000', // Next.js frontend
        'http://localhost:3001', // Vite frontend
        'http://localhost:3002', // Vite frontend (alternative port)
        'http://localhost:3003', // Vite frontend (alternative port)
        FRONTEND_URL // Environment variable override
      ],
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