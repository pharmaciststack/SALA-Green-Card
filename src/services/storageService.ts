import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadDoctorCert(uid: string, requestId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `doctor_certs/${uid}/${requestId}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
