import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'ceselgueta@gmail.com';

export async function POST(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email já verificado' });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Email verificado manualmente' });
  } catch (error) {
    console.error('Admin verify email error:', error);
    return NextResponse.json({ error: 'Erro ao verificar email' }, { status: 500 });
  }
}
