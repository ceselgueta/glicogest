import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MIN_GLUCOSE, MAX_GLUCOSE } from '@/lib/constants';
import { getRequiredSession } from '@/lib/get-session';
import { computePlanStatus } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check plan access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, planStartedAt: true, hasUsedTrial: true, pdfReportsGenerated: true, paymentStatus: true },
    });
    const planSt = computePlanStatus(user ?? { plan: 'free', planExpiresAt: null });
    if (!planSt.canRegisterReadings) {
      return NextResponse.json({
        success: false,
        error: 'Seu acesso expirou. Escolha um plano para continuar registrando medições.',
        code: 'PLAN_EXPIRED',
      }, { status: 403 });
    }

    const body = await request.json();
    const { readings } = body ?? {};

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhuma medida fornecida' }, { status: 400 });
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const reading of readings) {
      const { readingDate, readingType, valueMgDl, readingTime, notes, symptoms, observations } = reading ?? {};

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
            symptoms: symptoms || null,
            observations: observations || null,
          },
          create: {
            userId,
            readingDate: dateObj,
            readingType: readingType,
            valueMgDl: value,
            readingTime: readingTime || null,
            notes: notes || null,
            symptoms: symptoms || null,
            observations: observations || null,
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
