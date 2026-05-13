import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';
import { getPlanById } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, targetEmail } = body ?? {};

    // For now, allow self-activation or admin activation
    const email = targetEmail || session.user.email;

    const planDef = getPlanById(planId);
    if (!planDef) {
      return NextResponse.json({ success: false, error: 'Plano inválido' }, { status: 400 });
    }

    if (planDef.id === 'free_trial') {
      return NextResponse.json({
        success: false,
        error: 'Use a rota /api/plans/activate-trial para o teste grátis',
      }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + planDef.durationDays);

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        plan: planDef.id,
        planStartedAt: now,
        planExpiresAt: expiresAt,
        paymentStatus: 'paid',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plano ${planDef.name} ativado para ${email}`,
      data: {
        plan: planDef.id,
        planExpiresAt: expiresAt.toISOString(),
        daysRemaining: planDef.durationDays,
      },
    });
  } catch (error) {
    console.error('Error activating plan:', error);
    return NextResponse.json({ success: false, error: 'Erro ao ativar plano' }, { status: 500 });
  }
}
