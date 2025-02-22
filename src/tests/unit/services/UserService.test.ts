import { AppError } from '../../../errors/appError'
import { IUser, IUserCreate } from '../../../interfaces/user.interface'
import { UserRepository } from '../../../repositories/UserRepository'
import { UserService } from '../../../services/UserService'

jest.mock('../../../repositories/UserRepository')
jest.mock('../../../lib/GeoLib.ts', () => ({
  __esModule: true,
  default: {
    getAddressFromCoordinates: jest.fn().mockResolvedValue({
      street: 'Test Street',
      number: '123',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      zipCode: '12345-678',
    }),
    getCoordinatesFromAddress: jest.fn().mockResolvedValue({
      lat: -23.55052,
      lng: -46.633308,
    }),
  },
}))
const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    mockUserRepository.mockClear()
    userService = new UserService(new mockUserRepository())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }

      const createdUser: IUser = {
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        address: undefined,
        coordinates: undefined,
        regions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepository.prototype.findByEmail.mockResolvedValue(null)
      mockUserRepository.prototype.create.mockResolvedValue(createdUser)

      const result = await userService.create(userData)

      expect(result).toEqual(createdUser)
      expect(mockUserRepository.prototype.findByEmail).toHaveBeenCalledWith(userData.email)
      expect(mockUserRepository.prototype.create).toHaveBeenCalledWith(userData)
    })

    it('should throw an error when creating a user with an existing email', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }

      const existingUser: IUser = {
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        address: undefined,
        coordinates: undefined,
        regions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepository.prototype.findByEmail.mockResolvedValue(existingUser)

      await expect(userService.create(userData)).rejects.toThrow(
        AppError.OperationFailed('user', 'User already exists')
      )

      expect(mockUserRepository.prototype.findByEmail).toHaveBeenCalledWith(userData.email)
      expect(mockUserRepository.prototype.create).not.toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should find a user by ID successfully', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const user: IUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        address: undefined,
        coordinates: undefined,
        regions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepository.prototype.findById.mockResolvedValue(user)

      const result = await userService.findById(userId)

      expect(result).toEqual(user)
      expect(mockUserRepository.prototype.findById).toHaveBeenCalledWith(userId)
    })

    it('should throw an error when finding a non-existent user', async () => {
      const userId = '507f1f77bcf86cd799439011'

      mockUserRepository.prototype.findById.mockResolvedValue(null)

      await expect(userService.findById(userId)).rejects.toThrow(AppError.NotFound('user', userId))

      expect(mockUserRepository.prototype.findById).toHaveBeenCalledWith(userId)
    })
  })

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const updateData: IUserCreate = {
        name: 'Updated User',
        email: 'updated@example.com',
        password: 'newpassword123',
      }

      const updatedUser: IUser = {
        _id: userId,
        ...updateData,
        address: undefined,
        coordinates: undefined,
        regions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepository.prototype.findById.mockResolvedValue(updatedUser)
      mockUserRepository.prototype.update.mockResolvedValue(updatedUser)

      const result = await userService.update(userId, updateData)

      expect(result).toEqual(updatedUser)
      expect(mockUserRepository.prototype.findById).toHaveBeenCalledWith(userId)
      expect(mockUserRepository.prototype.update).toHaveBeenCalledWith(userId, updateData)
    })

    it('should throw an error when updating address and coordinates simultaneously', async () => {
      const userId = '507f1f77bcf86cd799439011'
      const updateData: IUserCreate = {
        name: 'Updated User',
        email: 'updated@example.com',
        password: 'newpassword123',
        address: {
          street: 'Test Street',
        },
        coordinates: [-46.633308, -23.55052],
      }

      await expect(userService.update(userId, updateData)).rejects.toThrow(
        AppError.OperationFailed('user', 'Cannot update address and coordinates simultaneously')
      )
    })
  })

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011'

      mockUserRepository.prototype.delete.mockResolvedValue(undefined)
      mockUserRepository.prototype.deleteRegionsByUserId.mockResolvedValue(undefined)

      await userService.delete(userId)

      expect(mockUserRepository.prototype.delete).toHaveBeenCalledWith(userId)
      expect(mockUserRepository.prototype.deleteRegionsByUserId).toHaveBeenCalledWith(userId)
    })
  })
})
