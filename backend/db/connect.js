import mongoose from 'mongoose'

function getMongoConfig() {
  const baseUriRaw = process.env.MONGODB_URI
  const dbNameRaw = process.env.DB_NAME

  const baseUri = typeof baseUriRaw === 'string' && baseUriRaw.trim() ? baseUriRaw.trim() : null
  const dbName = typeof dbNameRaw === 'string' && dbNameRaw.trim() ? dbNameRaw.trim() : null

  // Fallback (local)
  const fallbackUri = 'mongodb://localhost:27017'
  const fallbackDbName = 'admin_db'

  return {
    baseUri: baseUri || fallbackUri,
    dbName: dbName || fallbackDbName,
  }
}

export async function connectDB() {
  try {
    const { baseUri, dbName } = getMongoConfig()
    await mongoose.connect(baseUri, { dbName })
    console.log('MongoDB bağlandı:', mongoose.connection.host)
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err.message)
    throw err
  }
}
