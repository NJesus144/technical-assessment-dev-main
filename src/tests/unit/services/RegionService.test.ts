import { RegionService } from '../../../services/RegionService'

const mockRegionRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByPoint: jest.fn(),
  findNearPoint: jest.fn(),
  findOverlapping: jest.fn(),
}

describe('RegionService', () => {
  let regionService: RegionService

  beforeEach(() => {
    jest.clearAllMocks()
    regionService = new RegionService(mockRegionRepository)
  })

  const validRegionData = {
    name: 'Test Region',
    polygon: {
      coordinates: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ],
    },
    user: 'user123',
  }

  describe('createRegion', () => {
    it('must create a region with valid data', async () => {
      mockRegionRepository.findOverlapping.mockResolvedValue([])
      mockRegionRepository.create.mockResolvedValue({ ...validRegionData, id: 'region123' })

      const result = await regionService.create(validRegionData)

      expect(result).toHaveProperty('id', 'region123')
      expect(mockRegionRepository.findOverlapping).toHaveBeenCalledWith(
        validRegionData.polygon,
        undefined
      )
      expect(mockRegionRepository.create).toHaveBeenCalledWith(validRegionData)
    })

    it('should throw error when region name is too short', async () => {
      const invalidData = {
        ...validRegionData,
        name: 'ab',
      }

      await expect(regionService.create(invalidData)).rejects.toThrow(
        'Region name must be at least 3 characters'
      )
    })

    it('should throw error when polygon is invalid', async () => {
      const invalidData = {
        ...validRegionData,
        polygon: {
          coordinates: null,
        },
      }

      await expect(regionService.create(invalidData)).rejects.toThrow('Invalid polygon structure')
    })

    it('should throw error when overlapping with existing regions', async () => {
      mockRegionRepository.findOverlapping.mockResolvedValue([{ id: 'existingRegion' }])
      await expect(regionService.create(validRegionData)).rejects.toThrow(
        'Region overlaps with existing regions'
      )
    })

    it('should throw error when region name is empty', async () => {
      const invalidData = {
        ...validRegionData,
        name: '   ',
      }

      await expect(regionService.create(invalidData)).rejects.toThrow(
        'Region name must be at least 3 characters'
      )
    })
  })

  describe('getAllRegions', () => {
    let regionService: RegionService

    beforeEach(() => {
      jest.clearAllMocks()
      regionService = new RegionService(mockRegionRepository)
    })

    it('should return all regions successfully', async () => {
      const mockRegions = [
        { id: 'region1', name: 'Region 1', polygon: {} },
        { id: 'region2', name: 'Region 2', polygon: {} },
      ]

      mockRegionRepository.findAll.mockResolvedValue(mockRegions)

      const result = await regionService.findAll()

      expect(result).toEqual(mockRegions)
      expect(mockRegionRepository.findAll).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })

    it('should return empty array when there are no regions', async () => {
      mockRegionRepository.findAll.mockResolvedValue([])

      const result = await regionService.findAll()

      expect(result).toEqual([])
      expect(mockRegionRepository.findAll).toHaveBeenCalled()
      expect(result).toHaveLength(0)
    })

    it('should propagate repository error when failure occurs', async () => {
      const error = new Error('Database error')
      mockRegionRepository.findAll.mockRejectedValue(error)

      await expect(regionService.findAll()).rejects.toThrow('Database error')
    })
  })

  describe('getRegionById', () => {
    let regionService: RegionService

    beforeEach(() => {
      jest.clearAllMocks()
      regionService = new RegionService(mockRegionRepository)
    })

    it('should return a region when ID exists', async () => {
      const mockRegion = {
        id: 'region123',
        name: 'Test Region',
        polygon: {
          coordinates: [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ],
        },
      }

      mockRegionRepository.findById.mockResolvedValue(mockRegion)

      const result = await regionService.findById('region123')

      expect(result).toEqual(mockRegion)
      expect(mockRegionRepository.findById).toHaveBeenCalledWith('region123')
    })

    it('should throw error when ID is not provided', async () => {
      await expect(regionService.findById('')).rejects.toThrow('Region ID is required')
    })

    it('should return null when region does not exist', async () => {
      mockRegionRepository.findById.mockResolvedValue(null)

      const result = await regionService.findById('nonexistent')

      expect(result).toBeNull()
      expect(mockRegionRepository.findById).toHaveBeenCalledWith('nonexistent')
    })

    it('should propagate repository error when failure occurs', async () => {
      const error = new Error('Database error')
      mockRegionRepository.findById.mockRejectedValue(error)

      await expect(regionService.findById('region123')).rejects.toThrow('Database error')
    })
  })

  describe('updateRegion', () => {
    let regionService: RegionService

    beforeEach(() => {
      jest.clearAllMocks()
      regionService = new RegionService(mockRegionRepository)
    })

    it('should update region when data is valid', async () => {
      const updateData = {
        name: 'Updated Region',
        polygon: {
          coordinates: [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ],
        },
      }

      mockRegionRepository.findOverlapping.mockResolvedValue([])
      mockRegionRepository.update.mockResolvedValue({ id: 'region123', ...updateData })

      const result = await regionService.update('region123', updateData)

      expect(result).toHaveProperty('name', 'Updated Region')
      expect(mockRegionRepository.findOverlapping).toHaveBeenCalledWith(
        updateData.polygon,
        'region123'
      )
    })

    it('should throw error when new polygon overlaps existing region', async () => {
      const updateData = {
        polygon: {
          coordinates: [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ],
        },
      }

      mockRegionRepository.findOverlapping.mockResolvedValue([{ id: 'existingRegion' }])

      await expect(regionService.update('region123', updateData)).rejects.toThrow(
        'Region overlaps with existing regions'
      )
    })

    it('should throw error when new name is invalid', async () => {
      const updateData = {
        name: 'ab',
      }

      await expect(regionService.update('region123', updateData)).rejects.toThrow(
        'Region name must be at least 3 characters'
      )
    })

    it('should throw error when ID is not provided', async () => {
      const updateData = {
        name: 'Valid Name',
      }

      await expect(regionService.update('', updateData)).rejects.toThrow('Region ID is required')
    })
  })

  describe('deleteRegion', () => {
    let regionService: RegionService

    beforeEach(() => {
      jest.clearAllMocks()
      regionService = new RegionService(mockRegionRepository)
    })

    it('should delete region successfully', async () => {
      const validRegionId = '507f1f77bcf86cd799439011'
      mockRegionRepository.delete.mockResolvedValue({ success: true })

      const result = await regionService.delete(validRegionId)

      expect(result).toEqual({ success: true })
      expect(mockRegionRepository.delete).toHaveBeenCalledWith(validRegionId)
      expect(mockRegionRepository.delete).toHaveBeenCalledTimes(1)
    })

    it('should throw error when ID is not provided', async () => {
      await expect(regionService.delete('')).rejects.toThrow('Region ID is required')

      expect(mockRegionRepository.delete).not.toHaveBeenCalled()
    })
  })

  describe('getRegionsContainingPoint', () => {
    let regionService: RegionService

    beforeEach(() => {
      jest.clearAllMocks()
      regionService = new RegionService(mockRegionRepository)
    })

    it('should return regions that contain the valid point', async () => {
      const point: [number, number] = [10, 20]
      const mockRegions = [
        { id: 'region1', name: 'Region 1' },
        { id: 'region2', name: 'Region 2' },
      ]

      mockRegionRepository.findByPoint.mockResolvedValue(mockRegions)

      const result = await regionService.findByPoint(point)

      expect(result).toEqual(mockRegions)
      expect(mockRegionRepository.findByPoint).toHaveBeenCalledWith(point)
    })

    it('should throw error for invalid longitude', async () => {
      const invalidPoint: [number, number] = [181, 45]

      await expect(regionService.findByPoint(invalidPoint)).rejects.toThrow('Invalid coordinates')

      expect(mockRegionRepository.findByPoint).not.toHaveBeenCalled()
    })

    it('should throw error for invalid latitude', async () => {
      const invalidPoint: [number, number] = [45, 91]

      await expect(regionService.findByPoint(invalidPoint)).rejects.toThrow('Invalid coordinates')

      expect(mockRegionRepository.findByPoint).not.toHaveBeenCalled()
    })
  })

  describe('getRegionsNearPoint', () => {
    let regionService: RegionService

    beforeEach(() => {
      jest.clearAllMocks()
      regionService = new RegionService(mockRegionRepository)
    })

    it('must return regions close to the point with valid distance', async () => {
      const point: [number, number] = [10, 20]
      const maxDistance = 1000
      const userId = 'user123'
      const mockRegions = [
        { id: 'region1', name: 'Region 1', distance: 500 },
        { id: 'region2', name: 'Region 2', distance: 800 },
      ]

      mockRegionRepository.findNearPoint.mockResolvedValue(mockRegions)

      const result = await regionService.findNearPoint(point, maxDistance, userId)

      expect(result).toEqual(mockRegions)
      expect(mockRegionRepository.findNearPoint).toHaveBeenCalledWith(point, maxDistance, userId)
    })

    it('should work without userId', async () => {
      const point: [number, number] = [10, 20]
      const maxDistance = 1000

      mockRegionRepository.findNearPoint.mockResolvedValue([])

      await regionService.findNearPoint(point, maxDistance)

      expect(mockRegionRepository.findNearPoint).toHaveBeenCalledWith(point, maxDistance, undefined)
    })

    it('should throw error for invalid coordinates', async () => {
      const invalidPoint: [number, number] = [181, 45]
      const maxDistance = 1000

      await expect(regionService.findNearPoint(invalidPoint, maxDistance)).rejects.toThrow(
        'Invalid coordinates'
      )

      expect(mockRegionRepository.findNearPoint).not.toHaveBeenCalled()
    })

    it('should throw error for invalid distance', async () => {
      const point: [number, number] = [10, 20]
      const invalidDistance = 0

      await expect(regionService.findNearPoint(point, invalidDistance)).rejects.toThrow(
        'Distance must be greater than 0'
      )

      expect(mockRegionRepository.findNearPoint).not.toHaveBeenCalled()
    })

    it('should throw error for negative distance', async () => {
      const point: [number, number] = [10, 20]
      const invalidDistance = -100

      await expect(regionService.findNearPoint(point, invalidDistance)).rejects.toThrow(
        'Distance must be greater than 0'
      )

      expect(mockRegionRepository.findNearPoint).not.toHaveBeenCalled()
    })
  })
})
