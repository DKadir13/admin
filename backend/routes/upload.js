import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync, renameSync } from 'fs'
import { authMiddleware } from '../middleware/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadDir = join(__dirname, '..', 'uploads')
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname.match(/\.\w+$/) || ['.jpg'])[0]
    cb(null, `blog-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype)
    cb(null, !!ok)
  },
})

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname.match(/\.\w+$/) || ['.pdf'])[0]
    cb(null, `doc-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i.test(file.mimetype) ||
      /^application\/vnd\.ms-excel/i.test(file.mimetype) ||
      /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml/i.test(file.mimetype) ||
      /^text\/(plain|csv)/i.test(file.mimetype)
    cb(null, !!ok)
  },
})

const router = Router()

const MAX_IMAGE_PX = 1920
const JPEG_QUALITY = 82
const WEBP_QUALITY = 82
const PNG_COMPRESSION = 9

/** Resmi sıkıştır ve gerekirse yeniden boyutlandır (pixel/ boyut azaltma) */
async function compressImage(filePath) {
  const ext = (filePath.match(/\.\w+$/)?.[0] || '').toLowerCase()
  let pipeline = sharp(filePath)
    .resize(MAX_IMAGE_PX, MAX_IMAGE_PX, { fit: 'inside', withoutEnlargement: true })
  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: WEBP_QUALITY })
  } else if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: PNG_COMPRESSION })
  } else if (ext === '.gif') {
    pipeline = pipeline.gif({ effort: 7 })
  } else {
    return
  }
  await pipeline.toFile(filePath + '.tmp')
  renameSync(filePath + '.tmp', filePath)
}

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya seçilmedi veya geçersiz format.' })
  const filePath = join(uploadDir, req.file.filename)
  try {
    await compressImage(filePath)
  } catch (err) {
    console.error('Resim sıkıştırma hatası:', err.message)
  }
  res.json({ url: `/uploads/${req.file.filename}` })
})

router.post('/document', authMiddleware, uploadDoc.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya seçilmedi. PDF, Word veya Excel kabul edilir.' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

export default router
