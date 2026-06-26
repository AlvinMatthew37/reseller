import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { app, dialog, type BrowserWindow } from 'electron'

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export function getMenuImagesDirectory() {
  return path.join(app.getPath('userData'), 'menu-images')
}

function ensureMenuImagesDirectory() {
  fs.mkdirSync(getMenuImagesDirectory(), { recursive: true })
}

function sanitizeExtension(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()
  return allowedExtensions.has(extension) ? extension : '.png'
}

function getMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

export async function selectAndImportMenuImage(browserWindow: BrowserWindow) {
  const result = await dialog.showOpenDialog(browserWindow, {
    title: 'Select menu image',
    properties: ['openFile'],
    filters: [
      {
        name: 'Images',
        extensions: ['jpg', 'jpeg', 'png', 'webp'],
      },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const sourcePath = result.filePaths[0]
  const extension = sanitizeExtension(sourcePath)
  const targetFileName = `${randomUUID()}${extension}`
  const targetPath = path.join(getMenuImagesDirectory(), targetFileName)

  ensureMenuImagesDirectory()
  fs.copyFileSync(sourcePath, targetPath)

  return targetPath
}

export function writeImportedMenuImage(fileName: string, base64Data: string) {
  const safeFileName = path.basename(fileName)
  const extension = sanitizeExtension(safeFileName)
  const targetFileName = `${randomUUID()}${extension}`
  const targetPath = path.join(getMenuImagesDirectory(), targetFileName)

  ensureMenuImagesDirectory()
  fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'))

  return targetPath
}

export function getMenuImagePreviewUrl(imagePath: string) {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return null
  }

  const fileBuffer = fs.readFileSync(imagePath)
  const mimeType = getMimeType(imagePath)

  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`
}
