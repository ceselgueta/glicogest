import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { getRequiredSession } from '@/lib/get-session';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: false, error: 'Email já verificado' }, { status: 400 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'email-verify' },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '48h' }
    );

    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json({ success: true, message: 'Email de verificação reenviado!' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ success: false, error: 'Erro ao reenviar email' }, { status: 500 });
  }
}
