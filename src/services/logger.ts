import winston from 'winston';

const env = process.env.GXQ_ENV || 'local';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { environment: env },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: env !== 'local'
    }),
    new winston.transports.File({
      filename: `logs/${env}.log`,
      level: 'info',
      silent: env === 'local'
    })
  ],
});

// Example of a dedicated service transport for mainnet
if (env === 'mainnet') {
    // In a real application, you would add a transport for a logging service like Winston-CloudWatch or Winston-Loggly
    logger.add(new winston.transports.Console({
        level: 'error',
        format: winston.format.json()
    }));
}

export default logger;
