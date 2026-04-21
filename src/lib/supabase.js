import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || 'employee-documents'
const USE_PRIVATE_DOCS = (import.meta.env.VITE_SUPABASE_PRIVATE_DOCS || 'true') !== 'false'
const SIGNED_URL_TTL_SECONDS = Number(import.meta.env.VITE_SIGNED_URL_TTL_SECONDS || 900)

export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = hasSupabaseEnv
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check .env values.')
  }
  return supabase
}

function unwrap(result, fallbackMessage) {
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage)
  }
  return result.data
}

function normalizeStoragePath(fileReference, bucket = BUCKET_NAME) {
  if (!fileReference || typeof fileReference !== 'string') {
    return ''
  }

  const value = fileReference.trim()

  if (!value.startsWith('http')) {
    return value.replace(/^\/+/, '')
  }

  const markers = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`,
    `/storage/v1/object/authenticated/${bucket}/`,
  ]

  for (const marker of markers) {
    const markerIndex = value.indexOf(marker)
    if (markerIndex === -1) {
      continue
    }

    const rawPath = value.slice(markerIndex + marker.length)
    return decodeURIComponent(rawPath.split('?')[0])
  }

  return ''
}

async function resolveDocumentAccessUrl(fileReference, bucket = BUCKET_NAME) {
  const client = ensureClient()
  const storagePath = normalizeStoragePath(fileReference, bucket)

  if (!storagePath) {
    return fileReference
  }

  if (USE_PRIVATE_DOCS) {
    const signedResult = await client.storage
      .from(bucket)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

    if (!signedResult.error && signedResult.data?.signedUrl) {
      return signedResult.data.signedUrl
    }
  }

  const publicResult = client.storage.from(bucket).getPublicUrl(storagePath)
  return publicResult.data.publicUrl || fileReference
}

async function mapDocumentRow(row, bucket = BUCKET_NAME) {
  const storagePath = normalizeStoragePath(row.file_url, bucket) || row.file_url
  const accessUrl = await resolveDocumentAccessUrl(storagePath, bucket)

  return {
    ...row,
    file_url: storagePath,
    storage_path: storagePath,
    access_url: accessUrl,
  }
}

export async function fetchEmployees() {
  const client = ensureClient()
  const result = await client
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  return unwrap(result, 'Failed to load employees')
}

export async function insertEmployee(payload) {
  const client = ensureClient()
  const result = await client.from('employees').insert(payload).select().single()

  return unwrap(result, 'Failed to create employee')
}

export async function updateEmployeeById(id, payload) {
  const client = ensureClient()
  const result = await client
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return unwrap(result, 'Failed to update employee')
}

export async function deleteEmployeeById(id) {
  const client = ensureClient()

  const docsResult = await client
    .from('documents')
    .select('file_url')
    .eq('employee_id', id)
  const docs = unwrap(docsResult, 'Failed to load employee documents')

  for (const document of docs) {
    await deleteFileFromStorage(document.file_url, BUCKET_NAME)
  }

  const docDelete = await client.from('documents').delete().eq('employee_id', id)
  unwrap(docDelete, 'Failed to delete employee documents')

  const employeeDelete = await client.from('employees').delete().eq('id', id)
  unwrap(employeeDelete, 'Failed to delete employee')
}

export async function fetchDocumentsByEmployeeId(employeeId) {
  const client = ensureClient()
  const result = await client
    .from('documents')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  const rows = unwrap(result, 'Failed to load documents')
  return Promise.all(rows.map((row) => mapDocumentRow(row, BUCKET_NAME)))
}

export async function insertDocument(payload) {
  const client = ensureClient()
  const result = await client.from('documents').insert(payload).select().single()

  return unwrap(result, 'Failed to save document record')
}

export async function uploadDocumentFile(employeeId, file) {
  const client = ensureClient()
  const filePath = `${employeeId}/${file.name}`

  const upload = await client.storage.from(BUCKET_NAME).upload(filePath, file, {
    upsert: true,
    contentType: file.type,
  })
  unwrap(upload, 'Failed to upload document file')

  const accessUrl = await resolveDocumentAccessUrl(filePath, BUCKET_NAME)

  return {
    filePath,
    accessUrl,
  }
}

export async function deleteDocumentById(id, fileUrl, bucket = BUCKET_NAME) {
  const client = ensureClient()

  await deleteFileFromStorage(fileUrl, bucket)

  const deletion = await client.from('documents').delete().eq('id', id)
  unwrap(deletion, 'Failed to delete document record')
}

export async function deleteFileFromStorage(fileUrl, bucket = BUCKET_NAME) {
  const client = ensureClient()

  const storagePath = normalizeStoragePath(fileUrl, bucket)
  if (!storagePath) {
    return
  }

  const result = await client.storage.from(bucket).remove([storagePath])
  if (result.error && !/not found/i.test(result.error.message)) {
    throw new Error(result.error.message || 'Failed to delete file from storage')
  }
}
