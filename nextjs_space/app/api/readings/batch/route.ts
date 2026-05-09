import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MIN_GLUCOSE, MAX_GLUCOSE } from '@/lib/constants';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const userPlan = (session.user as any).plan || 'free';
    const body = await request.json();
    const { readings } = body ?? {};

    // Check 7-day limit for free plan
    if (userPlan === 'free') {
      const distinctDays = await prisma.gestationalGlucoseReading.findMany({
        where: { userId },
        select: { readingDate: true },
        distinct: ['readingDate'],
      });
      const existingDates = new Set(
        distinctDays.map((d: any) => d.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '')
      );
      const newDates = new Set(
        (readings || []).map((r: any) => r?.readingDate).filter(Boolean)
      );
      const allDates = new Set([...existingDates, ...newDates]);
      if (allDates.size > 7) {
        return NextResponse.json({
          success: false,
          error: 'Limite do plano gratuito atingido (7 dias de registros). Faça upgrade para continuar registrando.',
        }, { status: 403 });
      }
    }

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
            userId_readingDate_readingType: {
              userId,
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
            userId,
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
