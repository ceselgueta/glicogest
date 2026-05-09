import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MIN_GLUCOSE, MAX_GLUCOSE } from '@/lib/constants';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {
      OR: [{ userId }, { userId: null }],
    };
    
    if (startDate && endDate) {
      whereClause.readingDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const readings = await prisma.gestationalGlucoseReading.findMany({
      where: whereClause,
      orderBy: [{ readingDate: 'desc' }, { readingType: 'asc' }],
    });

    const formattedReadings = readings?.map?.((r: any) => ({
      ...r,
      readingDate: r?.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '',
      createdAt: r?.createdAt?.toISOString?.() ?? '',
      updatedAt: r?.updatedAt?.toISOString?.() ?? '',
    })) ?? [];

    return NextResponse.json({ success: true, data: formattedReadings });
  } catch (error) {
    console.error('Error fetching readings:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar medidas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const userPlan = (session.user as any).plan || 'free';

    const body = await request.json();

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
      const newDate = body?.readingDate;
      if (newDate && !existingDates.has(newDate) && existingDates.size >= 7) {
        return NextResponse.json({
          success: false,
          error: 'Limite do plano gratuito atingido (7 dias de registros). Faça upgrade para continuar registrando.',
        }, { status: 403 });
      }
    }
    const { readingDate, readingType, valueMgDl, readingTime, notes } = body ?? {};

    if (!readingDate || !readingType || valueMgDl === undefined || valueMgDl === null) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
    }

    const value = Number(valueMgDl);
    if (isNaN(value) || value < MIN_GLUCOSE || value > MAX_GLUCOSE) {
      return NextResponse.json({ 
        success: false, 
        error: `Valor deve estar entre ${MIN_GLUCOSE} e ${MAX_GLUCOSE} mg/dL` 
      }, { status: 400 });
    }

    const dateObj = new Date(readingDate + 'T12:00:00Z');

    const reading = await prisma.gestationalGlucoseReading.upsert({
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

    return NextResponse.json({ 
      success: true, 
      data: {
        ...reading,
        readingDate: reading?.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '',
        createdAt: reading?.createdAt?.toISOString?.() ?? '',
        updatedAt: reading?.updatedAt?.toISOString?.() ?? '',
      }
    });
  } catch (error) {
    console.error('Error saving reading:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar medida' }, { status: 500 });
  }
}
