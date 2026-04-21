import imageCompression from 'browser-image-compression'

const defaultOptions = {
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  maxSizeMB: 0.8,
  initialQuality: 0.75,
  fileType: 'image/webp',
}

export async function compressImage(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are supported.')
  }

  const compressed = await imageCompression(file, defaultOptions)

  const extension = compressed.type.includes('webp') ? 'webp' : 'jpg'
  const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-')
  const finalName = `${safeName}-${Date.now()}.${extension}`

  return new File([compressed], finalName, { type: compressed.type })
}
