import imageCompression from 'browser-image-compression'
import heic2any from 'heic2any'

const IMAGE_NAME_REGEX = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|png|tif|tiff|webp)$/i
const HEIC_NAME_REGEX = /\.(heic|heif)$/i

const TARGET_IMAGE_SIZE_KB = Number(import.meta.env.VITE_IMAGE_TARGET_SIZE_KB || 450)
const MAX_FINAL_IMAGE_SIZE_KB = Number(import.meta.env.VITE_IMAGE_MAX_SIZE_KB || 900)
const MAX_INPUT_FILE_SIZE_MB = Number(import.meta.env.VITE_IMAGE_INPUT_LIMIT_MB || 20)
const BYTES_IN_KB = 1024

const adaptiveCompressionProfiles = [
  { maxWidthOrHeight: 2600, maxSizeMB: 0.85, initialQuality: 0.95 },
  { maxWidthOrHeight: 2400, maxSizeMB: 0.7, initialQuality: 0.93 },
  { maxWidthOrHeight: 2200, maxSizeMB: 0.58, initialQuality: 0.9 },
  { maxWidthOrHeight: 2000, maxSizeMB: 0.48, initialQuality: 0.88 },
  { maxWidthOrHeight: 1800, maxSizeMB: 0.38, initialQuality: 0.84 },
]

function sanitizeBaseName(fileName) {
  const noExtension = fileName.replace(/\.[^.]+$/, '') || 'document'
  return noExtension
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

function bytesToMb(bytes) {
  return bytes / (1024 * 1024)
}

function bytesToKb(bytes) {
  return bytes / BYTES_IN_KB
}

function extensionFromFileName(fileName, fallback) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension || extension === fileName.toLowerCase()) {
    return fallback
  }
  return extension
}

function buildSafeFileName(fileName, extension) {
  const baseName = sanitizeBaseName(fileName)
  return `${baseName || 'document'}-${Date.now()}.${extension}`
}

function looksLikeHeic(file) {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    HEIC_NAME_REGEX.test(file.name)
  )
}

function looksLikeImage(file) {
  return file.type.startsWith('image/') || IMAGE_NAME_REGEX.test(file.name)
}

async function convertHeicToJpeg(file) {
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.95,
  })

  const blob = Array.isArray(converted) ? converted[0] : converted
  const finalName = buildSafeFileName(file.name.replace(HEIC_NAME_REGEX, ''), 'jpg')

  return new File([blob], finalName, { type: 'image/jpeg' })
}

async function compressAdaptive(sourceFile) {
  let bestCandidate = sourceFile

  for (const profile of adaptiveCompressionProfiles) {
    const candidate = await imageCompression(sourceFile, {
      ...profile,
      useWebWorker: true,
      preserveExif: true,
      fileType: 'image/webp',
    })

    if (candidate.size < bestCandidate.size) {
      bestCandidate = candidate
    }

    if (bytesToKb(candidate.size) <= TARGET_IMAGE_SIZE_KB) {
      return candidate
    }
  }

  return bestCandidate
}

export async function compressImage(file) {
  if (!(file instanceof File)) {
    throw new Error('Invalid file payload.')
  }

  if (!looksLikeImage(file)) {
    const extension = extensionFromFileName(file.name, 'bin')
    const finalName = buildSafeFileName(file.name, extension)
    return new File([file], finalName, {
      type: file.type || 'application/octet-stream',
    })
  }

  if (bytesToMb(file.size) > MAX_INPUT_FILE_SIZE_MB) {
    throw new Error(`File is too large. Maximum allowed size is ${MAX_INPUT_FILE_SIZE_MB}MB.`)
  }

  const sourceFile = looksLikeHeic(file) ? await convertHeicToJpeg(file) : file

  try {
    const compressed = await compressAdaptive(sourceFile)

    if (bytesToKb(compressed.size) > MAX_FINAL_IMAGE_SIZE_KB) {
      throw new Error(
        `Image is still too large after optimization. Keep it below ${MAX_FINAL_IMAGE_SIZE_KB}KB.`,
      )
    }

    const extension = compressed.type.includes('png')
      ? 'png'
      : compressed.type.includes('webp')
        ? 'webp'
        : 'jpg'

    const finalName = buildSafeFileName(sourceFile.name, extension)

    return new File([compressed], finalName, {
      type: compressed.type || sourceFile.type || 'image/jpeg',
    })
  } catch (error) {
    if (error instanceof Error && /too large/i.test(error.message)) {
      throw error
    }

    const extension = extensionFromFileName(sourceFile.name, 'jpg')
    const finalName = buildSafeFileName(sourceFile.name, extension)
    if (bytesToKb(sourceFile.size) > MAX_FINAL_IMAGE_SIZE_KB) {
      throw new Error(
        `Image is too large. Keep it below ${MAX_FINAL_IMAGE_SIZE_KB}KB for better storage usage.`,
      )
    }

    return new File([sourceFile], finalName, {
      type: sourceFile.type || 'image/jpeg',
    })
  }
}
