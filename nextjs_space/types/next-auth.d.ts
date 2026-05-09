import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      plan: string;
      planExpiresAt: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    plan?: string;
    planExpiresAt?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan: string;
    planExpiresAt: string | null;
  }
}
