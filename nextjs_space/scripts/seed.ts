import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 270);

  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Test User',
      password: hashedPassword,
      plan: 'gestation_full',
      planStartedAt: now,
      planExpiresAt: expiresAt,
      hasUsedTrial: true,
      pdfReportsGenerated: 0,
      paymentStatus: 'paid',
    },
  });

  console.log('Seed completed: test user created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
