export enum ErrorCodes {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: ErrorCodes,
    public entity: 'user' | 'region'
  ) {
    super(message)
    this.name = 'AppError'
  }

  static NotFound(entity: 'user' | 'region', id: string): AppError {
    return new AppError(`${entity} with id ${id} not found`, 404, ErrorCodes.NOT_FOUND, entity)
  }

  static OperationFailed(entity: 'user' | 'region', message: string): AppError {
    return new AppError(message, 400, ErrorCodes.OPERATION_FAILED, entity)
  }
}
