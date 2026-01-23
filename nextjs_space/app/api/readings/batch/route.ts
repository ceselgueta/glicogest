import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MIN_GLUCOSE, MAX_GLUCOSE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { readings } = body ?? {};

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhuma medida fornecida' }, { status: 400 });
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const reading of readings) {
      const { readingDate, readingType, valueMgDl, readingTime, notes } = reading ?? {};

      if (!readingDate || !readingType || valueMgDl === undefined || valueMgDl === null) {
        continue;
      }

      const value = Number(valueMgDl);
      if (isNaN(value) || value < MIN_GLUCOSE || value > MAX_GLUCOSE) {
        errors.push(`Valor inválido para ${readingType}: ${valueMgDl}`);
        continue;
      }

      try {
        const dateObj = new Date(readingDate + 'T12:00:00Z');
        
        const saved = await prisma.gestationalGlucoseReading.upsert({
          where: {
            readingDate_readingType: {
              readingDate: dateObj,
              readingType: readingType,
            },
          },
          update: {
            valueMgDl: value,
            readingTime: readingTime || null,
            notes: notes || null,
          },
          create: {
            readingDate: dateObj,
            readingType: readingType,
            valueMgDl: value,
            readingTime: readingTime || null,
            notes: notes || null,
          },
        });

        results.push({
          ...saved,
          readingDate: saved?.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '',
        });
      } catch (err) {
        errors.push(`Erro ao salvar ${readingType}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: results,
      savedCount: results.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error batch saving readings:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar medidas em lote' }, { status: 500 });
  }
}
