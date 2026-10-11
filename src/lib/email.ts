import nodemailer from "nodemailer";

const globalForMail = globalThis as unknown as { _mailer?: nodemailer.Transporter };

function transporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  return (globalForMail._mailer ??= nodemailer.createTransport({
    host: SMTP_HOST ?? "smtp.gmail.com",
    port: Number(SMTP_PORT ?? 465),
    secure: Number(SMTP_PORT ?? 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  }));
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  attachments?: { filename: string; content: Buffer }[],
) {
  const t = transporter();
  if (!t) {
    console.log(`[email:dev] to=${to} subject=${subject}\n${html}`);
    return;
  }
  await t.sendMail({
    from: process.env.EMAIL_FROM ?? `Rekapin <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}

export function resetLink(token: string) {
  return `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
}
