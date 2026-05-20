import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';
import { paymentApi } from '@/lib/mercadopago';
import { getPlanById } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// This endpoint is called when user returns from Mercado Pago
// to verify payment and activate plan if needed
export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { paymentId, externalReference } = await req.json();

    // First check if we have a payment record with this external reference
    if (externalReference) {
      const payment = await prisma.payment.findUnique({
        where: { id: externalReference },
      });

      if (payment && payment.userId === session.user.id) {
        // If already approved, return success
        if (payment.status === 'approved') {
          return NextResponse.json({ success: true, status: 'approved', amount: payment.amount });
        }

        // If we have MP payment ID, verify it
        if (paymentId) {
          try {
            const mpPayment = await paymentApi.get({ id: Number(paymentId) });
            
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                mpPaymentId: String(paymentId),
                mpStatus: mpPayment.status || null,
                mpStatusDetail: mpPayment.status_detail || null,
                status: mpPayment.status === 'approved' ? 'approved' :
                        mpPayment.status === 'rejected' ? 'rejected' : 'pending',
              },
            });

            if (mpPayment.status === 'approved') {
              const plan = getPlanById(payment.planId);
              if (plan) {
                const now = new Date();
                const expiresAt = new Date(now);
                expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

                await prisma.user.update({
                  where: { id: session.user.id },
                  data: {
                    plan: plan.id,
                    planStartedAt: now,
                    planExpiresAt: expiresAt,
                    paymentStatus: 'paid',
                    pdfReportsGenerated: 0,
                  },
                });
              }
              return NextResponse.json({ success: true, status: 'approved', amount: payment.amount });
            }

            return NextResponse.json({ success: true, status: mpPayment.status });
          } catch {
            console.error('[Verify] Error fetching MP payment');
          }
        }

        return NextResponse.json({ success: true, status: payment.status });
      }
    }

    // Check the latest pending payment for this user
    const latestPayment = await prisma.payment.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestPayment) {
      return NextResponse.json({ success: true, status: latestPayment.status });
    }

    return NextResponse.json({ success: false, status: 'not_found' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Erro ao verificar pagamento' }, { status: 500 });
  }
}
