import mongoose from 'mongoose'

function getMongoUri() {
  const uri = process.env.MONGODB_URI
  if (uri && typeof uri === 'string' && uri.trim()) return uri.trim()

  // Prod ortamda yanlışlıkla local DB'ye düşmeyelim.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI tanımlı değil. Production ortamda MongoDB Atlas URI zorunludur.')
  }

  // Dev fallback (local)
  return 'mongodb://localhost:27017/admin-panel'
}

export async function connectDB() {
  try {
    const uri = getMongoUri()
    await mongoose.connect(uri)
    console.log('MongoDB bağlandı:', mongoose.connection.host)
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err.message)
    throw err
  }
}
