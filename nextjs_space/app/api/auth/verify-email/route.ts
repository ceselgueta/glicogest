import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=token_missing', request.url));
  }

  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      userId: string;
      email: string;
      purpose: string;
    };

    if (payload.purpose !== 'email-verify') {
      return NextResponse.redirect(new URL('/login?error=token_invalid', request.url));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user || user.email !== payload.email) {
      return NextResponse.redirect(new URL('/login?error=token_invalid', request.url));
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
      // Welcome email only after verification confirmed
      sendWelcomeEmail(user.email, user.name).catch(() => {});
    }

    return NextResponse.redirect(new URL('/dashboard?verified=1', request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?error=token_expired', request.url));
  }
}
