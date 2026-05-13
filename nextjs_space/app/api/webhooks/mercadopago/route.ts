import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentApi } from '@/lib/mercadopago';
import { getPlanById } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[MP Webhook] Received:', JSON.stringify(body));

    // Handle payment notifications
    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;
      if (!paymentId) {
        console.log('[MP Webhook] No payment ID in notification');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Fetch payment details from Mercado Pago
      let mpPayment;
      try {
        mpPayment = await paymentApi.get({ id: paymentId });
      } catch (fetchErr) {
        console.error('[MP Webhook] Error fetching payment from MP:', fetchErr);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      console.log('[MP Webhook] Payment status:', mpPayment.status, 'external_reference:', mpPayment.external_reference);

      if (!mpPayment.external_reference) {
        console.log('[MP Webhook] No external_reference');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Find our payment record
      const payment = await prisma.payment.findUnique({
        where: { id: mpPayment.external_reference },
        include: { user: true },
      });

      if (!payment) {
        console.log('[MP Webhook] Payment not found:', mpPayment.external_reference);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Update payment record
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

      // If payment is approved, activate the plan
      if (mpPayment.status === 'approved') {
        const plan = getPlanById(payment.planId);
        if (plan) {
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

          await prisma.user.update({
            where: { id: payment.userId },
            data: {
              plan: plan.id,
              planStartedAt: now,
              planExpiresAt: expiresAt,
              paymentStatus: 'paid',
              pdfReportsGenerated: 0,
            },
          });

          console.log(`[MP Webhook] Plan ${plan.id} activated for user ${payment.userId} until ${expiresAt.toISOString()}`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[MP Webhook] Error:', error);
    // Always return 200 to avoid retries
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Mercado Pago also sends GET requests for verification
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
