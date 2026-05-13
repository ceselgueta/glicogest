import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentApi } from '@/lib/mercadopago';
import { getPlanById } from '@/lib/plans';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function verifyWebhookSignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.log('[MP Webhook] No webhook secret configured, skipping verification');
    return true;
  }

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature || !xRequestId) {
    console.log('[MP Webhook] Missing x-signature or x-request-id headers');
    return true; // Allow through if headers missing (MP doesn't always send them)
  }

  try {
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key?.trim() === 'ts') ts = value?.trim() || '';
      if (key?.trim() === 'v1') hash = value?.trim() || '';
    });

    if (!ts || !hash) return true;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    const isValid = generatedHash === hash;
    if (!isValid) {
      console.log('[MP Webhook] Signature verification failed');
    }
    return isValid;
  } catch (e) {
    console.error('[MP Webhook] Signature verification error:', e);
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[MP Webhook] Received:', JSON.stringify(body));

    // Verify signature
    const dataId = body.data?.id ? String(body.data.id) : '';
    if (dataId && !verifyWebhookSignature(req, dataId)) {
      console.log('[MP Webhook] Invalid signature, rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

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
