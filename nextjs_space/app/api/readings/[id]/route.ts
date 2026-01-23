import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 });
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
