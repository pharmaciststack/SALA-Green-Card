import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function uploadDoctorCert(uid: string, requestId: string, file: File): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type)) throw new Error('INVALID_FILE_TYPE')
  if (file.size > MAX_SIZE) throw new Error('FILE_TOO_LARGE')
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `doctor_certs/${uid}/${requestId}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
