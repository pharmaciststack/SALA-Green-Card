export function parseRequestError(e: unknown): string {
  console.error('[createRequest]', e)
  if (e instanceof Error) {
    const code = (e as { code?: string }).code ?? ''
    if (e.message === 'COMBINED_MONTH_LIMIT') return 'ถึงขีดจำกัด 2 ครั้ง/เดือนแล้ว'
    if (e.message === 'COMBINED_YEAR_LIMIT') return 'ถึงขีดจำกัด 12 ครั้ง/ปีแล้ว'
    if (e.message === 'INVALID_FILE_TYPE') return 'ไม่รองรับประเภทไฟล์นี้ กรุณาใช้รูปภาพหรือ PDF'
    if (e.message === 'FILE_TOO_LARGE') return 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5 MB)'
    if (code === 'permission-denied') return 'ไม่มีสิทธิ์บันทึกข้อมูล กรุณาติดต่อผู้ดูแลระบบ'
    if (code === 'unauthenticated') return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
    if (code === 'unavailable' || code === 'network-request-failed')
      return 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาลองใหม่'
    if (code === 'storage/unauthorized') return 'ไม่มีสิทธิ์อัปโหลดไฟล์'
  }
  return 'ยื่นคำขอไม่สำเร็จ กรุณาลองใหม่'
}
