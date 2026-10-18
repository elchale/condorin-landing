import "server-only";
import { formatDateTime, formatPhone } from "@/components/admin/format";
import { db } from "../db";
import { escapeHtml, sendMail } from "../mailer";
import { siteUrl } from "../site";

/**
 * Emails every active admin when someone signs up for the first time. Recipients come from the
 * Admin table, so adding or deactivating an admin also changes who gets these.
 * Never throws: a mail problem must not break sign-in.
 */
export async function notifyNewMember(phone: string) {
  try {
    const [admins, total] = await Promise.all([
      db.admin.findMany({ where: { active: true }, select: { email: true } }),
      db.member.count(),
    ]);
    if (admins.length === 0) return;

    const number = formatPhone(phone);
    const when = formatDateTime(new Date());
    const link = `${siteUrl()}/admin/usuarios`;

    await sendMail({
      to: admins.map((a) => a.email),
      subject: `Nuevo usuario en Ojo de Cóndor: ${number}`,
      text: `Se registró ${number} el ${when}.\nYa son ${total} usuarios.\n\nVer usuarios: ${link}`,
      html: `<p>Se registró <strong>${escapeHtml(number)}</strong> el ${escapeHtml(when)}.</p>
<p>Ya son ${total} usuarios.</p>
<p><a href="${escapeHtml(link)}">Ver usuarios en el panel</a></p>`,
    });
  } catch (error) {
    console.error("[notify] new member email failed:", error);
  }
}
