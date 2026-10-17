import "server-only";
import nodemailer from "nodemailer";
import { env } from "./env";

type Mail = { to: string[]; subject: string; text: string; html: string };

/** Sends through Qolca's SMTP from the verified info@qolca.org sender. */
export async function sendMail({ to, subject, text, html }: Mail) {
  const transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465, // 587 upgrades with STARTTLS
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  await transport.sendMail({ from: env.mailFrom, to, subject, text, html });
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
