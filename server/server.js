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

// Health check
app.get('/', (req, res) => {
    res.status(200).send('Job Portal API Working!')
})

// Sentry test route
app.get('/debug-sentry', (req, res) => {
    throw new Error('My first Sentry error!')
})

// Cache MongoDB connection across warm invocations
let dbConnection

const ensureDBConnection = async (req, res, next) => {
    try {
        if (!dbConnection) {
            dbConnection = connectDB().catch(error => {
                dbConnection = null
                throw error
            })
        }

        await dbConnection
        next()
    } catch (error) {
        console.error('MongoDB connection failed:', error)
        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        })
    }
}

// Connect database before database-dependent routes
app.use('/webhooks', ensureDBConnection)
app.use('/api', ensureDBConnection)

// Routes
app.post('/webhooks', clerkWebhooks)
app.use('/api/company', companyRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/users', userRoutes)

Sentry.setupExpressErrorHandler(app)

// Export Express app for Vercel
export default app
