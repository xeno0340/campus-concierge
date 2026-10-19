import nodemailer from 'nodemailer'

// Two ways to send, picked from server/.env:
//   BREVO_API_KEY            -> Brevo over HTTPS (works on hosts that block SMTP, e.g. Render's free tier)
//   EMAIL_USER + EMAIL_PASS  -> Gmail SMTP with an app password (easy for local development)
// With neither set, emails are skipped and the app works exactly as before.

const FROM_NAME = 'Campus Concierge'
let smtp // created on first use

const fromAddress = () => process.env.EMAIL_FROM || process.env.EMAIL_USER

export function emailMode() {
  if (process.env.BREVO_API_KEY && fromAddress()) return 'brevo'
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'smtp'
  return null
}

function smtpTransport() {
  if (!smtp) {
    smtp = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS.replace(/\s+/g, '') },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  }
  return smtp
}

// Throws on failure. Use sendMailSafe for "best effort" sending.
export async function sendMail({ to, subject, html, text }) {
  const mode = emailMode()
  if (!mode) return { skipped: true }

  if (mode === 'brevo') {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: fromAddress() },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 200)}`)
    return { sent: true }
  }

  await smtpTransport().sendMail({
    from: `"${FROM_NAME}" <${fromAddress()}>`,
    to,
    subject,
    html,
    text,
  })
  return { sent: true }
}

// An email problem must never break a booking, so errors are only logged
export async function sendMailSafe(message) {
  try {
    return await sendMail(message)
  } catch (err) {
    console.error(`Email to ${message.to} failed:`, err.message)
    return { failed: true }
  }
}