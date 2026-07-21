import winston from 'winston';

export const createLogger = () => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'dms-backend' },
    transports: [
      new winston.transports.Console({
        format: winston.format.json()
      })
    ],
  });
};

export const logger = createLogger();
