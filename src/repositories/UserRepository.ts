import logger from '../config/logger'
import { AppError } from '../errors/appError'
import { IUser, IUserCreate } from '../interfaces/user.interface'
import { RegionModel } from '../models/Region'
import { UserModel, toIUser } from '../models/User'

export class UserRepository {
  async create(data: IUserCreate): Promise<IUser | null> {
    const user = await UserModel.create(data)
    if (!user) {
      throw new Error('Failed to create user in database')
    }

    logger.info('User created in database', { userId: user._id })
    return user ? toIUser(user) : null
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await UserModel.findById(id)
    return user ? toIUser(user) : null
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email })
    return user ? toIUser(user) : null
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )

    if (!user) {
      throw AppError.NotFound('user', id)
    }
    logger.info('User updated successfully', { user })

    return user ? toIUser(user) : null
  }

  async delete(id: string): Promise<void> {
    const user = await UserModel.findByIdAndDelete(id)
    if (!user) {
      throw AppError.NotFound('user', id)
    }
    logger.info('User deleted from database', { userId: id })
  }

  async deleteRegionsByUserId(id: string): Promise<void> {
    await RegionModel.deleteMany({ user: id })
    logger.info('Regions deleted from database', { user: id })
  }
}
