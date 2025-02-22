import mongoose from 'mongoose'
import { AppError } from '../errors/appError'
import RegionRepository from '../repositories/RegionRepository'
import { RegionDTO, RegionUpdateDTO } from '../types/regions'

export class RegionService {
  constructor(private regionRepository: RegionRepository) {}

  async create(data: RegionDTO) {
    this.validateRegionData(data)
    await this.checkOverlap(data.polygon)
    return this.regionRepository.create(data)
  }

  async findAll() {
    return await this.regionRepository.findAll()
  }

  async findById(id: string) {
    if (!id) {
      throw AppError.OperationFailed('region', 'Region ID is required')
    }
    return await this.regionRepository.findById(id)
  }

  async update(id: string, data: RegionUpdateDTO) {
    if (!id) {
      throw AppError.OperationFailed('region', 'Region ID is required')
    }
    if (data.name !== undefined) {
      this.validateName(data.name)
    }
    if (data.polygon) {
      this.validatePolygon(data.polygon)
      await this.checkOverlap(data.polygon, id)
    }
    return this.regionRepository.update(id, data)
  }

  async delete(id: string) {
    if (!id) {
      throw AppError.NotFound('region', 'Region ID is required')
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.OperationFailed('region', 'Invalid Region ID')
    }
    return await this.regionRepository.delete(id)
  }

  async findByPoint(point: [number, number]) {
    if (!this.isValidCoordinates(point[0], point[1])) {
      throw AppError.OperationFailed('region', 'Invalid coordinates')
    }
    return await this.regionRepository.findByPoint(point)
  }

  async findNearPoint(point: [number, number], maxDistance: number, userId?: string) {
    if (!this.isValidCoordinates(point[0], point[1])) {
      throw AppError.OperationFailed('region', 'Invalid coordinates')
    }

    if (maxDistance <= 0) {
      throw AppError.OperationFailed('region', 'Distance must be greater than 0')
    }
    return await this.regionRepository.findNearPoint(point, maxDistance, userId)
  }

  private validateRegionData(data: RegionDTO): void {
    this.validateName(data.name)
    if (!data.polygon?.coordinates || data.polygon.coordinates.length === 0) {
      throw AppError.OperationFailed('region', 'Invalid polygon structure')
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length < 3) {
      throw AppError.OperationFailed('region', 'Region name must be at least 3 characters')
    }
  }

  private validatePolygon(polygon: any): void {
    if (!polygon || !polygon.coordinates || !Array.isArray(polygon.coordinates)) {
      throw AppError.OperationFailed('region', 'Invalid polygon structure')
    }

    const coordinates = polygon.coordinates[0]
    if (coordinates.length < 4 || !this.isPolygonClosed(coordinates)) {
      throw AppError.OperationFailed('region', 'Polygon must have at least 4 points and be closed')
    }
  }

  private isPolygonClosed(coordinates: number[][]): boolean {
    const firstPoint = coordinates[0]
    const lastPoint = coordinates[coordinates.length - 1]
    return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]
  }

  private async checkOverlap(polygon: any, excludeId?: string): Promise<void> {
    const overlapping = await this.regionRepository.findOverlapping(polygon, excludeId)
    if (overlapping.length > 0) {
      throw AppError.OperationFailed('region', 'Region overlaps with existing regions')
    }
  }

  private isValidCoordinates(longitude: number, latitude: number): boolean {
    return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
  }
}
