import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

export async function DELETE(
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

    // Verify ownership: reading must belong to user or have null userId
    const reading = await prisma.gestationalGlucoseReading.findUnique({
      where: { id },
    });

    if (!reading) {
      return NextResponse.json({ success: false, error: 'Medida não encontrada' }, { status: 404 });
    }

    if (reading.userId && reading.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    await prisma.gestationalGlucoseReading.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reading:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir medida' }, { status: 500 });
  }
}
