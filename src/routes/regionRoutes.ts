import { Router } from 'express'
import { RegionController } from '../controllers/RegionController'
import { authMiddleware } from '../middleware/authMiddleware'
import RegionRepository from '../repositories/RegionRepository'
import { RegionService } from './../services/RegionService'

const router = Router()

router.use(authMiddleware)

const regionRepository = new RegionRepository()
const regionService = new RegionService(regionRepository)
const regionController = new RegionController(regionService)

router.post('/regions', (req, res, next) => regionController.create(req, res, next))

router.get('/regions', (req, res, next) => regionController.findAll(req, res, next))
router.get('/regions/:id', (req, res, next) => regionController.findById(req, res, next))
router.patch('/regions/:id', (req, res, next) => regionController.update(req, res, next))
router.delete('/regions/:id', (req, res, next) => regionController.delete(req, res, next))

router.get('/regions/point/contains', (req, res, next) =>
  regionController.findByPoint(req, res, next)
)
router.get('/regions/point/near', (req, res, next) =>
  regionController.findNearPoint(req, res, next)
)

export default router
