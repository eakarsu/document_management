import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import type { Server } from 'http';
import expressWinston from 'express-winston';
import { config } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { BACKEND_PORT, ALLOWED_ORIGINS, RATE_LIMIT_CONFIG } from './config/constants';
import { setupRoutes } from './routes/setupRoutes';
import { setupGraphQL } from './graphql/setupGraphQL';

let activeServer: Server | undefined;
let shutdownStarted = false;

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
          frameSrc: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
    }));

    // Rate limiting
    const limiter = rateLimit(RATE_LIMIT_CONFIG);
    app.use('/graphql', limiter);

    // CORS - Allow configured origins from environment variable
    app.use(cors({
      origin: ALLOWED_ORIGINS,
      credentials: true,
    }));

    // Request logging
    app.use(expressWinston.logger({
      winstonInstance: logger,
      meta: false,
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

    const host = process.env.BACKEND_HOST;
    if (host !== '127.0.0.1') throw new Error('BACKEND_HOST=127.0.0.1 is required');
    activeServer = httpServer.listen(PORT, host, () => {
      logger.info(`Server ready at http://${host}:${PORT}`);
      logger.info(`GraphQL endpoint at http://${host}:${PORT}/graphql`);
      logger.info(`WebSocket server at ws://${host}:${PORT}/graphql`);
    });

  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

function shutdown(signal: string) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  logger.info('Graceful shutdown started', { signal });
  const timeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, 10_000);
  timeout.unref();
  if (!activeServer) return process.exit(0);
  activeServer.close(error => {
    clearTimeout(timeout);
    if (error) {
      logger.error('HTTP server shutdown failed', { error });
      return process.exit(1);
    }
    logger.info('HTTP server stopped');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
