import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * No RESEND_API_KEY configured (e.g. local dev) — lazily spin up a free
 * Ethereal test inbox instead of a real send. The message never leaves
 * Ethereal's sandbox; the preview link is logged so a developer can read it.
 */
let etherealTransporter: Promise<Transporter> | null = null;
function getEtherealTransporter(): Promise<Transporter> {
  if (!etherealTransporter) {
    etherealTransporter = nodemailer.createTestAccount().then((account) =>
      nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      })
    );
  }
  return etherealTransporter;
}

async function send(to: string, subject: string, html: string, text: string) {
  if (resend) {
    const { error } = await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, html, text });
    if (error) throw new Error(`Resend send failed: ${error.message}`);
    return;
  }

  const transporter = await getEtherealTransporter();
  const info = await transporter.sendMail({ from: "CocoSmart <no-reply@cocosmart.test>", to, subject, html, text });
  logger.info("Password reset email sent to Ethereal test inbox (no RESEND_API_KEY configured)", {
    previewUrl: nodemailer.getTestMessageUrl(info),
  });
}

export const emailService = {
  async sendPasswordResetEmail(to: string, resetUrl: string) {
    await send(
      to,
      "Reset your CocoSmart password",
      `<p>We received a request to reset your CocoSmart password.</p>
       <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 30 minutes.</p>
       <p>If you didn't request this, you can safely ignore this email.</p>`,
      `Reset your CocoSmart password: ${resetUrl} (expires in 30 minutes). If you didn't request this, ignore this email.`
    );
  },
};
