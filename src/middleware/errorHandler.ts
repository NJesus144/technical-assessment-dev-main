import { NextFunction, Request, Response } from 'express'
import { logError } from '../config/logger'
import { AppError } from '../errors/appError'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  logError(error, 'ErrorHandler', {
    path: req.path,
    method: req.method,
  })

  const errorResponse = {
    status: 'error',
    message: error.message || 'Internal server error',
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(errorResponse)
  }

  return res.status(500).json({
    ...errorResponse,
    message: 'Internal server error',
  })
}
