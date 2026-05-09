import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Test User',
      password: hashedPassword,
      plan: 'premium',
    },
  });

  console.log('Seed completed: test user created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
