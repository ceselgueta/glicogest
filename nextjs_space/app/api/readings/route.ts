import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MIN_GLUCOSE, MAX_GLUCOSE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};
    
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
    const body = await request.json();
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
