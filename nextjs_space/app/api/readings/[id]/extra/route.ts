import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 });
    }

    // Verify ownership
    const reading = await prisma.gestationalGlucoseReading.findUnique({
      where: { id },
    });

    if (!reading) {
      return NextResponse.json({ success: false, error: 'Medida não encontrada' }, { status: 404 });
    }

    if (reading.userId && reading.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { symptoms, observations } = body ?? {};

    const updated = await prisma.gestationalGlucoseReading.update({
      where: { id },
      data: {
        symptoms: symptoms || null,
        observations: observations || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        readingDate: updated?.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '',
        createdAt: updated?.createdAt?.toISOString?.() ?? '',
        updatedAt: updated?.updatedAt?.toISOString?.() ?? '',
      },
    });
  } catch (error) {
    console.error('Error updating reading extra:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar detalhes' }, { status: 500 });
  }
}
