import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.patientSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        patientName: settings.patientName,
        birthDate: settings.birthDate?.toISOString?.()?.split?.('T')?.[0] ?? null,
        pregnancyWeeks: settings.pregnancyWeeks,
        estimatedDueDate: settings.estimatedDueDate?.toISOString?.()?.split?.('T')?.[0] ?? null,
        doctorName: settings.doctorName,
        fastingTarget: settings.fastingTarget,
        postMealTarget: settings.postMealTarget,
        postMealProtocol: settings.postMealProtocol,
        createdAt: settings.createdAt?.toISOString?.() ?? '',
        updatedAt: settings.updatedAt?.toISOString?.() ?? '',
      },
    });
  } catch (error) {
    console.error('Error fetching patient settings:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar dados da paciente' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientName, birthDate, pregnancyWeeks, estimatedDueDate, doctorName, fastingTarget, postMealTarget, postMealProtocol } = body ?? {};

    if (!patientName?.trim?.()) {
      return NextResponse.json({ success: false, error: 'Nome da paciente é obrigatório' }, { status: 400 });
    }
    if (!fastingTarget || fastingTarget < 50 || fastingTarget > 300) {
      return NextResponse.json({ success: false, error: 'Meta em jejum inválida' }, { status: 400 });
    }
    if (!postMealTarget || postMealTarget < 50 || postMealTarget > 300) {
      return NextResponse.json({ success: false, error: 'Meta pós-refeição inválida' }, { status: 400 });
    }
    if (!['1h', '2h'].includes(postMealProtocol)) {
      return NextResponse.json({ success: false, error: 'Protocolo de medição inválido' }, { status: 400 });
    }

    const existing = await prisma.patientSettings.findFirst();

    const data = {
      patientName: patientName.trim(),
      birthDate: birthDate ? new Date(birthDate) : null,
      pregnancyWeeks: pregnancyWeeks ? Number(pregnancyWeeks) : null,
      estimatedDueDate: estimatedDueDate ? new Date(estimatedDueDate) : null,
      doctorName: doctorName?.trim?.() || null,
      fastingTarget: Number(fastingTarget),
      postMealTarget: Number(postMealTarget),
      postMealProtocol: postMealProtocol,
    };

    let settings;
    if (existing) {
      settings = await prisma.patientSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await prisma.patientSettings.create({ data });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        patientName: settings.patientName,
        birthDate: settings.birthDate?.toISOString?.()?.split?.('T')?.[0] ?? null,
        pregnancyWeeks: settings.pregnancyWeeks,
        estimatedDueDate: settings.estimatedDueDate?.toISOString?.()?.split?.('T')?.[0] ?? null,
        doctorName: settings.doctorName,
        fastingTarget: settings.fastingTarget,
        postMealTarget: settings.postMealTarget,
        postMealProtocol: settings.postMealProtocol,
        createdAt: settings.createdAt?.toISOString?.() ?? '',
        updatedAt: settings.updatedAt?.toISOString?.() ?? '',
      },
    });
  } catch (error) {
    console.error('Error saving patient settings:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar dados da paciente' }, { status: 500 });
  }
}
