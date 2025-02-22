import logger from '../config/logger'
import { AppError } from '../errors/appError'
import { IUser, IUserCreate } from '../interfaces/user.interface'
import { UserRepository } from '../repositories/UserRepository'

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(data: IUserCreate) {
    const existingUser = await this.userRepository.findByEmail(data.email)

    if (existingUser) {
      logger.warn('Attempted to create duplicate user', { email: data.email })
      throw new Error('User already exists')
    }

    if (!data.name || !data.email || !data.password) {
      throw new Error('Name, email, and password are required')
    }

    const user = await this.userRepository.create(data)

    if (!user) {
      throw new Error('Falha ao criar usuário')
    }

    logger.info('User created successfully', { userId: user._id })
    return user
  }

  async findById(id: string): Promise<IUser> {
    const user = await this.userRepository.findById(id)
    this.validateId(id)
    if (!user) {
      logger.warn('User not found', { userId: id })
      throw AppError.NotFound('user', id)
    }
    return user
  }

  async update(id: string, data: IUserCreate): Promise<IUser> {
    this.validateId(id)
    this.validateUpdateData(data)

    const user = await this.userRepository.findById(id)
    if (!user) {
      logger.warn('Attempted to update non-existent user', { userId: id })
      throw AppError.NotFound('user', id)
    }

    return this.userRepository.update(id, this.processUpdateData(data))
  }

  async delete(id: string): Promise<void> {
    this.validateId(id)
    await this.userRepository.delete(id)

    await this.userRepository.deleteRegionsByUserId(id)
  }

  private validateUpdateData(data: IUserCreate): void {
    if (data.address && data.coordinates) {
      throw AppError.OperationFailed('user', 'Cannot update address and coordinates simultaneously')
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw AppError.OperationFailed('user', 'Invalid email address')
    }
  }

  private validateId(id: string): void {
    if (!id) {
      throw AppError.OperationFailed('user', 'User ID is required')
    }
  }

  private processUpdateData(data: IUserCreate): IUserCreate {
    const updateData = { ...data }

    if (updateData.address) {
      updateData.coordinates = undefined
    }

    if (updateData.coordinates) {
      updateData.address = undefined
    }

    return updateData
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}
