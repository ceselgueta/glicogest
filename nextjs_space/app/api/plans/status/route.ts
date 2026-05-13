import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';
import { computePlanStatus } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        planExpiresAt: true,
        planStartedAt: true,
        hasUsedTrial: true,
        pdfReportsGenerated: true,
        paymentStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const status = computePlanStatus(user);
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error('Error fetching plan status:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar status do plano' }, { status: 500 });
  }
}
