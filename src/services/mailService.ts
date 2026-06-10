import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { UserProfile } from '../types'
import { writeAuditLog } from './auditLogService'

export interface MailPayload {
  to: string[]
  subject: string
  body: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendMailNotification(
  payload: MailPayload,
  actor?: UserProfile
): Promise<string> {
  const safeBody = escapeHtml(payload.body).replace(/\n/g, '<br/>')
  const ref = await addDoc(collection(db, 'mail'), {
    to: payload.to,
    message: {
      subject: payload.subject,
      text: payload.body,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#16a34a;padding:20px;border-radius:12px 12px 0 0">
          <h2 style="color:white;margin:0">📋 ระบบลาและบันทึกเวลาทำงาน</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="white-space:pre-line;color:#374151;line-height:1.7">${safeBody}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af">อีเมลนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
        </div>
      </div>`,
    },
    createdAt: serverTimestamp(),
  })

  if (actor) {
    await writeAuditLog(actor, 'send_notification', {
      mailId: ref.id,
      recipientCount: payload.to.length,
      subject: payload.subject,
    })
  }

  return ref.id
}
