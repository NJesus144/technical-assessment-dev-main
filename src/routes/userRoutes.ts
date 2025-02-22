import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { authMiddleware } from '../middleware/authMiddleware'
import { UserRepository } from '../repositories/UserRepository'
import { UserService } from '../services/UserService'

const router = Router()

const userRepository = new UserRepository()
const userService = new UserService(userRepository)
const userController = new UserController(userService)

router.get('/users/:id', authMiddleware, (req, res, next) =>
  userController.findById(req, res, next)
)
router.patch('/users/:id', authMiddleware, (req, res, next) =>
  userController.update(req, res, next)
)
router.delete('/users/:id', authMiddleware, (req, res, next) =>
  userController.delete(req, res, next)
)

export default router
