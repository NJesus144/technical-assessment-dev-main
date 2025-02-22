import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User, UserModel } from '../models/User'

const jwtSecret = process.env.JWT_SECRET || 'secret'

interface RequestWithUser extends Request {
  user?: User
}

export const authMiddleware = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ message: 'Token not provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string }
    const user = await UserModel.findById(decoded.id)

    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: (error as Error).message })
    return
  }
}
