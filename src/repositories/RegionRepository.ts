import mongoose from 'mongoose'
import logger from '../config/logger'
import { AppError } from '../errors/appError'
import { RegionModel } from '../models/Region'
import { Polygon, RegionUpdateDTO } from '../types/regions'

class RegionRepository {
  async create(regionData: { name: string; polygon: Polygon; user: string }) {
    return await RegionModel.create(regionData)
  }

  async findAll() {
    return await RegionModel.find().populate('user', 'name email')
  }

  async findById(id: string) {
    const region = await RegionModel.findById(id).populate('user', 'name email')
    if (!region) {
      throw AppError.NotFound('region', id)
    }
  }

  async findByUserId(userId: string) {
    const regions = await RegionModel.find({ user: userId }).populate('user', 'name email')
    return regions
  }

  async findOverlapping(polygon: Polygon, excludeId?: string) {
    const query: any = {
      polygon: {
        $geoIntersects: {
          $geometry: polygon,
        },
      },
    }

    if (excludeId) {
      query._id = { $ne: excludeId }
    }

    return await RegionModel.find(query)
  }

  async update(id: string, data: RegionUpdateDTO) {
    const region = await RegionModel.findByIdAndUpdate(id, { $set: data }, { new: true }).populate(
      'user',
      'name email'
    )

    if (!region) {
      throw AppError.NotFound('region', id)
    }
    return region
  }

  async delete(id: string) {
    const region = await RegionModel.findByIdAndDelete(id)
    if (!region) {
      logger.error('Region not found', { regionId: id })
      throw AppError.NotFound('region', id)
    }

    await mongoose.model('User').updateOne({ _id: region.user }, { $pull: { regions: region._id } })

    return region
  }

  async findByPoint(point: [number, number]) {
    return await RegionModel.find({
      polygon: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: point,
          },
        },
      },
    }).populate('user', 'name email')
  }

  async findNearPoint(point: [number, number], maxDistance: number, userId?: string) {
    const query: any = {
      polygon: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: point,
          },
          $maxDistance: maxDistance,
        },
      },
    }

    if (userId) {
      query.user = userId
    }

    return await RegionModel.find(query).populate('user', 'name email')
  }
}

export default RegionRepository
