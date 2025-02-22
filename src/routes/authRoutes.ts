import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { UserRepository } from '../repositories/UserRepository'
import { AuthService } from '../services/AuthService'
import { UserService } from '../services/UserService'

const router = Router()

const userRepository = new UserRepository()
const userService = new UserService(userRepository)
const authService = new AuthService()
const authController = new AuthController(authService, userService)

router.post('/register', (req, res) => authController.register(req, res))
router.post('/login', (req, res) => authController.login(req, res))

export default router
