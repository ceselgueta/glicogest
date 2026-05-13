import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MIN_GLUCOSE, MAX_GLUCOSE } from '@/lib/constants';
import { getRequiredSession } from '@/lib/get-session';
import { computePlanStatus } from '@/lib/plans';

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
      symptoms: r?.symptoms ?? null,
      observations: r?.observations ?? null,
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

    // Check plan access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, planStartedAt: true, hasUsedTrial: true, pdfReportsGenerated: true, paymentStatus: true },
    });
    const status = computePlanStatus(user ?? { plan: 'free', planExpiresAt: null });
    if (!status.canRegisterReadings) {
      return NextResponse.json({
        success: false,
        error: 'Seu acesso expirou. Escolha um plano para continuar registrando medições.',
        code: 'PLAN_EXPIRED',
      }, { status: 403 });
    }

    const body = await request.json();
    const { readingDate, readingType, valueMgDl, readingTime, notes, symptoms, observations } = body ?? {};

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

    return NextResponse.json({ 
      success: true, 
      data: {
        ...reading,
        readingDate: reading?.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '',
        createdAt: reading?.createdAt?.toISOString?.() ?? '',
        updatedAt: reading?.updatedAt?.toISOString?.() ?? '',
        symptoms: reading?.symptoms ?? null,
        observations: reading?.observations ?? null,
      }
    });
  } catch (error) {
    console.error('Error saving reading:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar medida' }, { status: 500 });
  }
}
