import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
          emailVerified: user.emailVerified?.toISOString() ?? null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan ?? 'free';
        token.planExpiresAt = (user as any).planExpiresAt ?? null;
        token.planStartedAt = (user as any).planStartedAt ?? null;
        token.hasUsedTrial = (user as any).hasUsedTrial ?? false;
        token.pdfReportsGenerated = (user as any).pdfReportsGenerated ?? 0;
        token.paymentStatus = (user as any).paymentStatus ?? 'not_required';
        token.emailVerified = (user as any).emailVerified ?? null;
      }
      // Refresh plan info from DB on session update or if missing
      if (trigger === 'update' || !token.plan) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              plan: true,
              planExpiresAt: true,
              planStartedAt: true,
              hasUsedTrial: true,
              pdfReportsGenerated: true,
              paymentStatus: true,
              emailVerified: true,
            },
          });
          if (dbUser) {
            token.plan = dbUser.plan;
            token.planExpiresAt = dbUser.planExpiresAt?.toISOString() ?? null;
            token.planStartedAt = dbUser.planStartedAt?.toISOString() ?? null;
            token.hasUsedTrial = dbUser.hasUsedTrial;
            token.pdfReportsGenerated = dbUser.pdfReportsGenerated;
            token.paymentStatus = dbUser.paymentStatus;
            token.emailVerified = dbUser.emailVerified?.toISOString() ?? null;
          }
        } catch {
          // Silently fail - use cached token data
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan ?? 'free';
        (session.user as any).planExpiresAt = token.planExpiresAt ?? null;
        (session.user as any).planStartedAt = token.planStartedAt ?? null;
        (session.user as any).hasUsedTrial = token.hasUsedTrial ?? false;
        (session.user as any).pdfReportsGenerated = token.pdfReportsGenerated ?? 0;
        (session.user as any).paymentStatus = token.paymentStatus ?? 'not_required';
        (session.user as any).emailVerified = token.emailVerified ?? null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  cookies: {
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  events: {
    // Dispara apenas para novos usuários via Google SSO (email/senha é tratado em /api/signup)
    createUser: async ({ user }) => {
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
