import { NextFunction, Request, Response } from 'express'
import logger from '../config/logger'
import { RegionService } from '../services/RegionService'

export class RegionController {
  constructor(private regionService: RegionService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Creating new region', { regionData: req.body })
      const region = await this.regionService.create(req.body)
      res.status(201).json({ status: 'success', region })
    } catch (error) {
      logger.error('Error creating region', { error })
      next(error)
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching all regions')
      const regions = await this.regionService.findAll()
      res.status(200).json(regions)
    } catch (error) {
      logger.error('Error fetching regions', { error })
      next(error)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching region by ID', { regionId: req.params.id })
      const region = await this.regionService.findById(req.params.id)
      res.status(200).json(region)
    } catch (error) {
      logger.error('Error fetching region by ID', { error, regionId: req.params.id })
      next(error)
    }
  }

  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching regions by user id', { userId: req.params.userId })
      const regions = await this.regionService.findByUserId(req.params.userId)
      res.status(200).json(regions)
    } catch (error) {
      logger.error('Error fetching user regions', { error, userId: req.params.userId })
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Updating region', { regionId: req.params.id, regionData: req.body })
      console.log(req.params.id, req.body)
      const region = await this.regionService.update(req.params.id, req.body)
      res.status(200).json({ status: 'success', region })
    } catch (error) {
      logger.error('Error updating region', { error, regionId: req.params.id })
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Deleting region', { regionId: req.params.id })
      await this.regionService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      logger.error('Error deleting region', { error, regionId: req.params.id })
      next(error)
    }
  }

  async findByPoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Finding region by point', { point: req.query })
      const { longitude, latitude } = req.query
      const point: [number, number] = [Number(longitude), Number(latitude)]
      const regions = await this.regionService.findByPoint(point)
      res.status(200).json({ status: 'success', regions })
    } catch (error) {
      logger.error('Error finding region by point', { error })
      next(error)
    }
  }

  async findNearPoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Finding regions near point', { point: req.query })
      const { longitude, latitude, distance, userId } = req.query
      const point: [number, number] = [Number(longitude), Number(latitude)]

      const regions = await this.regionService.findNearPoint(
        point,
        Number(distance),
        userId as string | undefined
      )
      res.status(200).json({ status: 'success', regions })
    } catch (error) {
      logger.error('Error finding regions near point', { error })
      next(error)
    }
  }
}
