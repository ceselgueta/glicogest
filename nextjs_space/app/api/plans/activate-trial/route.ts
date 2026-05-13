import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, hasUsedTrial: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.hasUsedTrial) {
      return NextResponse.json({
        success: false,
        error: 'Você já utilizou o teste grátis. Escolha um plano pago para continuar.',
      }, { status: 403 });
    }

    // Check if user already has an active paid plan
    if (user.plan !== 'free') {
      return NextResponse.json({
        success: false,
        error: 'Você já possui um plano ativo.',
      }, { status: 403 });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 4);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        plan: 'free_trial',
        planStartedAt: now,
        planExpiresAt: expiresAt,
        hasUsedTrial: true,
        pdfReportsGenerated: 0,
        paymentStatus: 'not_required',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Teste grátis ativado com sucesso!',
      data: {
        plan: 'free_trial',
        planExpiresAt: expiresAt.toISOString(),
        daysRemaining: 4,
      },
    });
  } catch (error) {
    console.error('Error activating trial:', error);
    return NextResponse.json({ success: false, error: 'Erro ao ativar teste grátis' }, { status: 500 });
  }
}
