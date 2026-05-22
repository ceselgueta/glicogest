import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'ceselgueta@gmail.com';

export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    if (email === ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Não é possível excluir o admin' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await prisma.user.delete({ where: { email } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
