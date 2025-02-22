import { Request, Response } from 'express'
import { AuthService } from '../services/AuthService'
import { UserService } from '../services/UserService'

export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, address, coordinates } = req.body

      if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email and password are required' })
        return
      }

      if (!this.validateEmail(email)) {
        res.status(400).json({ message: 'Invalid email' })
        return
      }

      if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters long' })
        return
      }

      const user = await this.userService.create({
        name,
        email,
        password,
        address,
        coordinates,
      })

      if (!user) {
        res.status(400).json({ message: 'Failed to create user' })
        return
      }

      const token = this.authService.generateToken(user._id)
      res.status(201).json({ user, token })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Error registering user',
      })
    }
  }

  public login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      const result = await this.authService.authenticate(email, password)
      if (!result) {
        res.status(401).json({ message: 'Invalid username or password' })
        return
      }

      const { user, token } = result
      res.status(200).json({ user, token })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Error logging in',
      })
    }
  }

  private validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }
}
