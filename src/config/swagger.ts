// src/config/swagger.ts
import { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'

const swaggerDocument = YAML.load(path.join(__dirname, '../../swagger.yaml'))

export const setupSwagger = (app: Express) => {
  console.log('Configurando Swagger...')

  app.get('/swagger-test', (req, res) => {
    res.json({ message: 'Swagger route accessible' })
  })

  app.use(
    '/api-docs',
    (req, res, next) => {
      console.log('Requisição recebida na rota /api-docs')
      next()
    },
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  )

  console.log('Swagger configurado na rota: /api-docs')
}
