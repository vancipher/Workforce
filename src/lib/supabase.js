import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || 'employee-documents'

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

  const docs = await fetchDocumentsByEmployeeId(id)
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

  return unwrap(result, 'Failed to load documents')
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

  const publicUrlData = client.storage.from(BUCKET_NAME).getPublicUrl(filePath)
  const publicUrl = publicUrlData.data.publicUrl

  if (!publicUrl) {
    throw new Error('Could not resolve public URL for uploaded file')
  }

  return {
    filePath,
    publicUrl,
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

  const marker = `/storage/v1/object/public/${bucket}/`
  const markerIndex = fileUrl.indexOf(marker)

  if (markerIndex === -1) {
    return
  }

  const rawPath = fileUrl.slice(markerIndex + marker.length)
  const decodedPath = decodeURIComponent(rawPath)

  const result = await client.storage.from(bucket).remove([decodedPath])
  unwrap(result, 'Failed to delete file from storage')
}
