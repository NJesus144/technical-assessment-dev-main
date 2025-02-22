import clc from 'cli-color'
import winston from 'winston'

const colors = {
  error: clc.red.bold,
  warn: clc.yellow.bold,
  info: clc.blue.bold,
  debug: clc.green.bold,
}

const coloredFormat = winston.format.printf(({ level, message, timestamp }) => {
  const color = colors[level] || clc.white
  return `${timestamp} ${color(`[${level.toUpperCase()}]`)} ${message}`
})

const logger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        coloredFormat
      ),
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  )
}

export const logError = (error: Error, context: string, additionalInfo?: object) => {
  logger.error({
    message: error.message,
    context,
    stack: error.stack,
    ...additionalInfo,
  })
}

export const logInfo = (message: string, context: string, additionalInfo?: object) => {
  logger.info({
    message,
    context,
    ...additionalInfo,
  })
}

export default logger
