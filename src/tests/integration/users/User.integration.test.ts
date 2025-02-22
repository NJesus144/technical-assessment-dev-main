import jwt from 'jsonwebtoken'
import request from 'supertest'
import { app } from '../../../app'
import { connectDB, disconnectDB } from '../../../config/database'
import { RegionModel } from '../../../models/Region'
import { UserModel } from '../../../models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

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

describe('User API Integration Tests', () => {
  let authToken: string
  let userId: string
  jest.setTimeout(30000)

  beforeAll(async () => {
    await connectDB(
      'mongodb://root:example@localhost:27017/oz-tech-test-integration?authSource=admin'
    )
  })

  afterAll(async () => {
    await UserModel.deleteMany({})
    await RegionModel.deleteMany({})
    await disconnectDB()
  })

  beforeEach(async () => {
    await UserModel.deleteMany({})

    const user = await UserModel.create({
      name: 'Test User',
      email: 'emailExemplo@example.com',
      password: 'password123',
      address: {
        street: 'Test Street',
        number: '123',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345-678',
      },
    })

    userId = user._id.toString()
    authToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' })
  })

  describe('POST /api/register', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser123@example.com',
        password: 'password123',
        address: {
          street: 'Avenida Paulista',
          number: '1000',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil',
          zipCode: '01310-100',
        },
      }

      const response = await request(app).post('/api/register').send(userData)

      expect(response.status).toBe(201)
      expect(response.body.user).toBeDefined()
      expect(response.body.token).toBeDefined()
      expect(response.body.user.name).toBe(userData.name)
      expect(response.body.user.email).toBe(userData.email)
    })

    it('should fail to create a user with an existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        coordinates: [-46.633308, -23.55052],
      }

      await UserModel.create(userData)

      const response = await request(app).post('/api/register').send(userData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'User already exists')
    })

    it('should fail to create a user with invalid data', async () => {
      const invalidUserData = {
        name: '',
        email: 'invalid-email',
        password: '123',
      }

      const response = await request(app).post('/api/register').send(invalidUserData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('GET /api/users/:id', () => {
    it('should get user by id successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toBeDefined()
      expect(response.body.data._id).toBe(userId)
      expect(response.body.data.email).toBe('emailExemplo@example.com')
    })

    it('should fail to get user with invalid id', async () => {
      const invalidId = 'invalid-id'
      const response = await request(app)
        .get(`/api/users/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message')
    })

    it('should fail to get user without authentication', async () => {
      const response = await request(app).get(`/api/users/${userId}`)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('PATCH /api/users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        address: {
          street: 'Nova Rua',
          number: '200',
          city: 'Rio de Janeiro',
          state: 'RJ',
          country: 'Brasil',
          zipCode: '22000-000',
        },
      }

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.address.city).toBe(updateData.address.city)
    })

    it('should fail to update user with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        address: {
          street: 'Nova Rua',
        },
      }

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })

    it('should fail to update with both address and coordinates', async () => {
      const conflictData = {
        address: {
          street: 'Nova Rua',
          number: '200',
          city: 'Rio de Janeiro',
          state: 'RJ',
          country: 'Brasil',
          zipCode: '22000-000',
        },
        coordinates: [-22.9068, -43.1729],
      }

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictData)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Cannot update address and coordinates simultaneously')
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      const newUser = await UserModel.create({
        name: 'Delete Test User',
        email: 'delete-test@example.com',
        password: 'password123',
        address: {
          street: 'Test Street',
          number: '123',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345-678',
        },
      })

      const testToken = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' })

      const deleteResponse = await request(app)
        .delete(`/api/users/${newUser._id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(deleteResponse.status).toBe(204)

      const getUserResponse = await request(app)
        .get(`/api/users/${newUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(getUserResponse.status).toBe(404)
    })

    it('should fail to delete non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'

      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message')
    })

    it('should fail to delete user without authentication', async () => {
      const response = await request(app).delete(`/api/users/${userId}`)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
    })
  })
})
