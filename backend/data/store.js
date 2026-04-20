import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '.')

function getPath(filename) {
  return join(dataDir, filename)
}

export function readJson(filename, defaultValue = []) {
  const path = getPath(filename)
  if (!existsSync(path)) return defaultValue
  try {
    const raw = readFileSync(path, 'utf8')
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

export function writeJson(filename, data) {
  const path = getPath(filename)
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
}

export function nextId(items) {
  if (!items.length) return 1
  const ids = items.map((x) => (x.id != null ? Number(x.id) : 0))
  return Math.max(...ids) + 1
}
