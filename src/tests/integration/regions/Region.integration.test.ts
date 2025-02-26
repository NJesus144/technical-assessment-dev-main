import request from 'supertest'

import jwt from 'jsonwebtoken'
import { app } from '../../../app'
import { RegionModel } from '../../../models/Region'
import { connectDB, disconnectDB } from '../../../config/database'
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

describe('Region API Integration Tests', () => {
  let authToken: string
  let userId: string

  beforeAll(async () => {
    await connectDB(
      'mongodb://root:example@localhost:27017/oz-tech-test-integration?authSource=admin'
    )
  })

  afterAll(async () => {
    await RegionModel.deleteMany({})
    await UserModel.deleteMany({})
    await disconnectDB()
  })

  beforeEach(async () => {
    await RegionModel.deleteMany({})
    await UserModel.deleteMany({})

    const user = await UserModel.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      coordinates: [-46.633308, -23.55052],
    })

    userId = user._id.toString()
    authToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' })
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('POST /api/regions', () => {
    it('should create a new region successfully', async () => {
      const regionData = {
        name: 'Test Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      }

      const response = await request(app)
        .post('/api/regions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(regionData)

      expect(response.status).toBe(201)
      expect(response.body.status).toBe('success')
      expect(response.body.region.name).toBe(regionData.name)
      expect(response.body.region.polygon).toBeDefined()
    })

    it('should fail to create a region with invalid polygon', async () => {
      const invalidRegionData = {
        name: 'Test Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.55052],
            ],
          ],
        },
        user: userId,
      }

      const response = await request(app)
        .post('/api/regions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRegionData)

      expect([400, 500]).toContain(response.status)
      expect(response.body).toHaveProperty('message')
    })

    it('should fail to create a region with invalid name', async () => {
      const invalidRegionData = {
        name: '',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      }

      const response = await request(app)
        .post('/api/regions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRegionData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('GET /api/regions', () => {
    it('should list all regions successfully', async () => {
      const region1 = await RegionModel.create({
        name: 'Region 1',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      })

      const region2 = await RegionModel.create({
        name: 'Region 2',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      })

      const response = await request(app)
        .get('/api/regions')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(2)
      expect(response.body[0].name).toBe(region1.name)
      expect(response.body[1].name).toBe(region2.name)
    })

    it('should return an empty list when no regions are found', async () => {
      const response = await request(app)
        .get('/api/regions')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.length).toBe(0)
    })
  })

  describe('PATCH /api/regions/:id', () => {
    let regionId: string

    beforeEach(async () => {
      const region = await RegionModel.create({
        name: 'Test Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      })

      regionId = region._id.toString()
    })

    it('should update the name of a region successfully', async () => {
      const updatedName = 'Updated Region Name'
      const response = await request(app)
        .patch(`/api/regions/${regionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: updatedName })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.region.name).toBe(updatedName)
      expect(response.body.region.polygon).toBeDefined()
    })

    it('should update the polygon of a region successfully', async () => {
      const updatedPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-46.633308, -23.55052],
            [-46.633308, -23.54052],
            [-46.623308, -23.54052],
            [-46.623308, -23.55052],
            [-46.633308, -23.55052],
          ],
        ],
      }

      const response = await request(app)
        .patch(`/api/regions/${regionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ polygon: updatedPolygon })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.region.polygon.coordinates).toEqual(updatedPolygon.coordinates)
      expect(response.body.region.name).toBe('Test Region')
    })

    it('should fail to update a region with non-existent ID', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'
      const response = await request(app)
        .patch(`/api/regions/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message', `region with id ${nonExistentId} not found`)
    })

    it('should fail to update a region with invalid name', async () => {
      const response = await request(app)
        .patch(`/api/regions/${regionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })

    it('should fail to update a region with invalid polygon', async () => {
      const invalidPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-46.633308, -23.55052],
            [-46.633308, -23.54052],
            [-46.623308, -23.55052],
          ],
        ],
      }

      const response = await request(app)
        .patch(`/api/regions/${regionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ polygon: invalidPolygon })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })

    it('should fail to update a region with overlapping polygon', async () => {
      await RegionModel.create({
        name: 'Overlapping Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      })

      const updatedPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-46.633308, -23.55052],
            [-46.633308, -23.54052],
            [-46.623308, -23.54052],
            [-46.623308, -23.55052],
            [-46.633308, -23.55052],
          ],
        ],
      }

      const response = await request(app)
        .patch(`/api/regions/${regionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ polygon: updatedPolygon })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Region overlaps with existing regions')
    })
  })

  describe('DELETE /api/regions/:id', () => {
    let regionId: string

    beforeEach(async () => {
      const region = await RegionModel.create({
        name: 'Test Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      })

      regionId = region._id.toString()
    })

    it('should delete a region successfully', async () => {
      const response = await request(app)
        .delete(`/api/regions/${regionId}`)
        .set('Authorization', `Bearer ${authToken}`)

      console.log('Response:', response.status, response.body)

      expect(response.status).toBe(204)

      const deletedRegion = await RegionModel.findById(regionId)
      expect(deletedRegion).toBeNull()
    })

    it('should fail to delete a region with non-existent ID', async () => {
      const validButNonExistentId = '507f1f77bcf86cd799439011'
      const response = await request(app)
        .delete(`/api/regions/${validButNonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        status: 'error',
        message: `region with id ${validButNonExistentId} not found`,
      })
    })

    it('should fail to delete a region with invalid ID', async () => {
      const invalidId = 'invalid-id'
      const response = await request(app)
        .delete(`/api/regions/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Invalid Region ID')
    })
  })

  describe('GET /api/regions/point/contains', () => {
    beforeEach(async () => {
      await RegionModel.create({
        name: 'Test Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      })
    })

    it('should return regions containing the point', async () => {
      const response = await request(app)
        .get('/api/regions/point/contains')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: -46.63, latitude: -23.55 })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.regions.length).toBe(1)
      expect(response.body.regions[0].name).toBe('Test Region')
    })

    it('should return an empty list if no regions contain the point', async () => {
      const response = await request(app)
        .get('/api/regions/point/contains')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: -47.0, latitude: -24.0 })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.regions.length).toBe(0)
    })

    it('should fail with invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/regions/point/contains')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: 200, latitude: -100 })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('GET /api/regions/point/near', () => {
    beforeEach(async () => {
      await RegionModel.create({
        name: 'Test Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: userId,
      })
    })

    it('should return regions near the point', async () => {
      const response = await request(app)
        .get('/api/regions/point/near')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: -46.63, latitude: -23.55, distance: 1000 })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.regions.length).toBe(1)
      expect(response.body.regions[0].name).toBe('Test Region')
    })

    it('should return an empty list if no regions are near the point', async () => {
      const response = await request(app)
        .get('/api/regions/point/near')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: -47.0, latitude: -24.0, distance: 1000 })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.regions.length).toBe(0)
    })

    it('should fail with invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/regions/point/near')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: 200, latitude: -100, distance: 1000 })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Invalid coordinates')
    })

    it('should fail with invalid distance', async () => {
      const response = await request(app)
        .get('/api/regions/point/near')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: -46.63, latitude: -23.55, distance: -100 })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Distance must be greater than 0')
    })

    it('should filter regions by user ID if provided', async () => {
      const anotherUser = await UserModel.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
        coordinates: [-46.633308, -23.55052],
      })

      await RegionModel.create({
        name: 'Another Region',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [-46.633308, -23.55052],
              [-46.633308, -23.54052],
              [-46.623308, -23.54052],
              [-46.623308, -23.55052],
              [-46.633308, -23.55052],
            ],
          ],
        },
        user: anotherUser._id,
      })

      const response = await request(app)
        .get('/api/regions/point/near')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ longitude: -46.63, latitude: -23.55, distance: 1000, userId: userId })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.regions.length).toBe(1)
      expect(response.body.regions[0].name).toBe('Test Region')
    })
  })
})
