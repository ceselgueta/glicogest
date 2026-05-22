import { NextResponse } from 'next/server';
import { getRequiredSession } from '@/lib/get-session';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'ceselgueta@gmail.com';

export async function POST() {
  const session = await getRequiredSession();
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada' });
  }

  // Checar domínios verificados
  let domains: any = null;
  try {
    const resend = new Resend(apiKey);
    const domainRes = await (resend as any).domains?.list?.();
    domains = domainRes;
  } catch (e: any) {
    domains = { error: e?.message };
  }

  // Tentar enviar email de teste para o próprio admin
  let sendResult: any = null;
  try {
    const resend = new Resend(apiKey);
    sendResult = await resend.emails.send({
      from: 'GlicoGest <noreply@glicogest.com.br>',
      to: ADMIN_EMAIL,
      subject: '[TESTE] Diagnóstico Resend — GlicoGest',
      html: '<p>Email de teste enviado com sucesso. O Resend está funcionando.</p>',
    });
  } catch (e: any) {
    sendResult = { exception: e?.message };
  }

  return NextResponse.json({ domains, sendResult });
}
