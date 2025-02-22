import { NextFunction, Request, Response } from 'express'
import logger from '../config/logger'
import { UserService } from './../services/UserService'

export class UserController {
  constructor(private userService: UserService) {}

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching user by id', { userId: req.params.id })
      const user = await this.userService.findById(req.params.id)
      res.status(200).json({ status: 'success', data: user })
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Updating user', { userId: req.params.id })
      const user = await this.userService.update(req.params.id, req.body)
      res.status(200).json({ status: 'success', data: user })
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Deleting user', { userId: req.params.id })
      await this.userService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
