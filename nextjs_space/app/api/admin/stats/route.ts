import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'ceselgueta@gmail.com';

export async function GET() {
  try {
    const session = await getRequiredSession();
    if (!session || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const [
      totalUsers,
      usersByPlan,
      recentSignups,
      totalReadings,
      users,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['plan'],
        _count: { id: true },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.gestationalGlucoseReading.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          planExpiresAt: true,
          planStartedAt: true,
          hasUsedTrial: true,
          paymentStatus: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { readings: true } },
        },
      }),
    ]);

    const planCounts: Record<string, number> = {};
    for (const row of usersByPlan) {
      planCounts[row.plan] = row._count.id;
    }

    return NextResponse.json({
      totalUsers,
      recentSignups,
      totalReadings,
      planCounts,
      users,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
