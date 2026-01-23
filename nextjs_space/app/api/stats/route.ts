import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GLUCOSE_THRESHOLD, READING_TYPES } from '@/lib/constants';

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
    });

    const totalReadings = readings?.length ?? 0;
    const aboveThreshold = readings?.filter?.((r: any) => (r?.valueMgDl ?? 0) > GLUCOSE_THRESHOLD)?.length ?? 0;
    const percentAbove = totalReadings > 0 ? Math.round((aboveThreshold / totalReadings) * 100) : 0;

    const byType: any = {};
    for (const type of READING_TYPES) {
      const typeReadings = readings?.filter?.((r: any) => r?.readingType === type) ?? [];
      const typeTotal = typeReadings?.length ?? 0;
      const typeAbove = typeReadings?.filter?.((r: any) => (r?.valueMgDl ?? 0) > GLUCOSE_THRESHOLD)?.length ?? 0;
      const typePercent = typeTotal > 0 ? Math.round((typeAbove / typeTotal) * 100) : 0;
      
      byType[type] = {
        total: typeTotal,
        above: typeAbove,
        percent: typePercent,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        totalReadings,
        aboveThreshold,
        percentAbove,
        byType,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
