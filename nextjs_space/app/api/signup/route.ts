import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body ?? {};

    if (!email?.trim() || !password) {
      return NextResponse.json({ success: false, error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Este email já está cadastrado' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        plan: 'free',
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar conta' }, { status: 500 });
  }
}
