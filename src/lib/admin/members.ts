import "server-only";
import { db } from "../db";

export const MEMBERS_PAGE_SIZE = 50;

/** One page of members, newest first. `query` matches any part of the phone number. */
export async function listMembers({ page, query }: { page: number; query: string }) {
  const digits = query.replace(/\D/g, "");
  const where = digits ? { phone: { contains: digits } } : {};
  const [total, rows] = await Promise.all([
    db.member.count({ where }),
    db.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * MEMBERS_PAGE_SIZE,
      take: MEMBERS_PAGE_SIZE,
      select: { id: true, phone: true, createdAt: true, lastSignInAt: true, consentAt: true },
    }),
  ]);
  return { total, rows, pages: Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE)) };
}

/** Headline numbers for the overview. */
export async function memberStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, newThisWeek, activeThisWeek] = await Promise.all([
    db.member.count(),
    db.member.count({ where: { createdAt: { gte: weekAgo } } }),
    db.member.count({ where: { lastSignInAt: { gte: weekAgo } } }),
  ]);
  return { total, newThisWeek, activeThisWeek };
}
