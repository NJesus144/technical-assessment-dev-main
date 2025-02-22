import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/User'

export class AuthService {
  private readonly jwtSecret: string

  constructor() {
    if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
      throw new Error('JWT_SECRET and JWT_EXPIRES_IN must be provided')
    }

    this.jwtSecret = process.env.JWT_SECRET
  }
  public generateToken(userId: string): string {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const oneDay = '1d'
    return jwt.sign({ id: userId }, this.jwtSecret, { expiresIn: oneDay })
  }

  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  public async authenticate(email: string, password: string) {
    const user = await UserModel.findOne({ email }).select('+password')

    if (!user || !(await this.verifyPassword(password, user.password))) {
      return null
    }

    const token = this.generateToken(user._id)

    const userWithoutPassword = user.toObject()
    delete userWithoutPassword.password

    return { user: userWithoutPassword, token }
  }
}
