import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';
import { preferenceApi } from '@/lib/mercadopago';
import { getPlanById } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plano não informado' }, { status: 400 });
    }

    const plan = getPlanById(planId);
    if (!plan || plan.price <= 0) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        status: 'pending',
      },
    });

    // Build base URL from NEXTAUTH_URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://glicogest.abacusai.app';

    // Create Mercado Pago preference
    const preference = await preferenceApi.create({
      body: {
        items: [
          {
            id: plan.id,
            title: `GlicoGest - ${plan.name}`,
            description: `Acesso ao GlicoGest por ${plan.durationDays} dias`,
            quantity: 1,
            unit_price: plan.price,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: user.email,
          name: user.name || undefined,
        },
        external_reference: payment.id,
        back_urls: {
          success: `${baseUrl}/pagamento/resultado?status=success`,
          failure: `${baseUrl}/pagamento/resultado?status=failure`,
          pending: `${baseUrl}/pagamento/resultado?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'GLICOGEST',
      },
    });

    // Update payment with preference ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: preference.id },
    });

    return NextResponse.json({
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });
  } catch (error) {
    console.error('Error creating preference:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}
