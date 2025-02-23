import mongoose from 'mongoose'

export const connectDB = async (uri?: string) => {
  try {
    const MONGO_URI =  process.env.MONGODB_URL || uri
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export const disconnectDB = async () => {
  await mongoose.disconnect()
  console.log('MongoDB disconnected')
}
