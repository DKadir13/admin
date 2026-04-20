import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './db/connect.js'
import { seedSites } from './db/seed.js'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import sitesRoutes from './routes/sites.js'
import blogRoutes from './routes/blog.js'
import productsRoutes from './routes/products.js'
import domainsRoutes from './routes/domains.js'
import publicRoutes from './routes/public.js'
import uploadRoutes from './routes/upload.js'
import statsRoutes from './routes/stats.js'
import activityRoutes from './routes/activity.js'
import exportRoutes from './routes/export.js'
import announcementsRoutes from './routes/announcements.js'
import quickLinksRoutes from './routes/quickLinks.js'
import notesRoutes from './routes/notes.js'
import eventsRoutes from './routes/events.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = join(__dirname, 'uploads')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

app.use('/api/auth', authRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/sites', sitesRoutes)
app.use('/api/sites', blogRoutes)
app.use('/api/sites', productsRoutes)
app.use('/api/sites', eventsRoutes)
app.use('/api/domains', domainsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/announcements', announcementsRoutes)
app.use('/api/quick-links', quickLinksRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/public', publicRoutes)

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

async function start() {
  await connectDB()
  await seedSites()
  app.listen(PORT, () => {
    console.log(`Backend http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Sunucu başlatılamadı:', err)
  process.exit(1)
})
