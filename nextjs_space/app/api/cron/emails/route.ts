import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReminderEmail, sendTrialExpiringEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Vercel sets Authorization: Bearer <CRON_SECRET> for cron requests
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();

  // D+2: todos os usuários criados há exatamente 2 dias (janela de 24h)
  const d2Start = new Date(now);
  d2Start.setDate(d2Start.getDate() - 2);
  d2Start.setHours(0, 0, 0, 0);
  const d2End = new Date(d2Start);
  d2End.setHours(23, 59, 59, 999);

  // D+3 (trial expirando amanhã): usuários com plan=free_trial e planExpiresAt amanhã
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const [d2Users, expiringUsers] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: d2Start, lte: d2End } },
      select: { email: true, name: true },
    }),
    prisma.user.findMany({
      where: {
        plan: 'free_trial',
        planExpiresAt: { gte: tomorrowStart, lte: tomorrowEnd },
      },
      select: { email: true, name: true },
    }),
  ]);

  const results = await Promise.allSettled([
    ...d2Users.map((u) => sendReminderEmail(u.email, u.name)),
    ...expiringUsers.map((u) => sendTrialExpiringEmail(u.email, u.name)),
  ]);

  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`[Cron/emails] D+2: ${d2Users.length} · D+3 expirando: ${expiringUsers.length} · falhas: ${failed}`);

  return NextResponse.json({
    d2: d2Users.length,
    d3_expiring: expiringUsers.length,
    failed,
  });
}
