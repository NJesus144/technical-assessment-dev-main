import * as dotenv from 'dotenv'
dotenv.config()

import cors from 'cors'
import express, { ErrorRequestHandler } from 'express'
import { setupSwagger } from './config/swagger'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/authRoutes'
import regionRoutes from './routes/regionRoutes'
import userRoutes from './routes/userRoutes'

const app = express()

app.use(cors())
app.use(express.json())

setupSwagger(app)

app.get('/', (req, res) => {
  res.send('API is running!')
})

app.use('/api', authRoutes)
app.use('/api', userRoutes)
app.use('/api', regionRoutes)

app.use(errorHandler as ErrorRequestHandler)

export { app }
