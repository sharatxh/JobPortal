
import './config/instrument.js'
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import * as Sentry from '@sentry/node'
import { clerkWebhooks } from './controllers/webhooks.js'
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js'
import jobRoutes from './routes/jobRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { clerkMiddleware } from '@clerk/express'

const app = express()

// Configure Cloudinary
connectCloudinary()

// Middlewares
app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

// Connect to MongoDB before handling API requests
let dbConnection

app.use(async (req, res, next) => {
    try {
        if (!dbConnection) {
            dbConnection = connectDB()
        }

        await dbConnection
        next()
    } catch (error) {
        console.error('Database connection error:', error)
        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        })
    }
})

// Routes
app.get('/', (req, res) => {
    res.send('Job Portal API Working!')
})

app.get('/debug-sentry', (req, res) => {
    throw new Error('My first Sentry error!')
})

app.post('/webhooks', clerkWebhooks)

app.use('/api/company', companyRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/users', userRoutes)

Sentry.setupExpressErrorHandler(app)

// IMPORTANT: Export app instead of using app.listen()
export default app
