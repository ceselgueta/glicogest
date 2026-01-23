import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const READING_TYPES = ['JEJUM', 'POS_CAFE_2H', 'POS_ALMOCO_2H', 'POS_JANTA_2H'] as const;

function getRandomValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateReadingValue(type: string): number {
  // Gerar valores realisticos com alguns acima de 120
  const baseRanges: Record<string, [number, number]> = {
    JEJUM: [75, 115],
    POS_CAFE_2H: [90, 145],
    POS_ALMOCO_2H: [85, 140],
    POS_JANTA_2H: [80, 135],
  };
  const range = baseRanges[type] ?? [80, 120];
  return getRandomValue(range[0], range[1]);
}

async function main() {
  console.log('Iniciando seed de dados mock...');

  // Limpar dados existentes
  await prisma.gestationalGlucoseReading.deleteMany({});
  console.log('Dados anteriores removidos.');

  // Gerar dados para os últimos 10 dias
  const today = new Date();
  const readings: any[] = [];

  for (let daysAgo = 0; daysAgo < 10; daysAgo++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(12, 0, 0, 0);

    // Nem todos os dias terão todas as medidas
    const typesToInclude = daysAgo < 7 
      ? READING_TYPES 
      : READING_TYPES.filter(() => Math.random() > 0.3);

    for (const type of typesToInclude) {
      readings.push({
        readingDate: date,
        readingType: type,
        valueMgDl: generateReadingValue(type),
        notes: daysAgo === 0 ? 'Medida de hoje' : null,
      });
    }
  }

  // Inserir dados
  for (const reading of readings) {
    await prisma.gestationalGlucoseReading.create({
      data: reading,
    });
  }

  console.log(`${readings.length} medidas inseridas com sucesso!`);
  
  // Mostrar resumo
  const total = await prisma.gestationalGlucoseReading.count();
  const aboveThreshold = await prisma.gestationalGlucoseReading.count({
    where: { valueMgDl: { gt: 120 } },
  });
  
  console.log(`\nResumo:`);
  console.log(`- Total de medidas: ${total}`);
  console.log(`- Acima de 120: ${aboveThreshold}`);
  console.log(`- Percentual elevado: ${Math.round((aboveThreshold / total) * 100)}%`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
