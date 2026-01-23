import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GLUCOSE_THRESHOLD, READING_TYPE_LABELS, READING_TYPES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

function formatDateBR(dateStr: string): string {
  const [year, month, day] = (dateStr ?? '').split('-');
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body ?? {};

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Período não informado' }, { status: 400 });
    }

    const readings = await prisma.gestationalGlucoseReading.findMany({
      where: {
        readingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { readingDate: 'asc' },
    });

    // Agrupar por data
    const byDate: Record<string, Record<string, number>> = {};
    for (const reading of readings ?? []) {
      const dateStr = reading?.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '';
      if (!byDate[dateStr]) byDate[dateStr] = {};
      byDate[dateStr][reading?.readingType ?? ''] = reading?.valueMgDl ?? 0;
    }

    // Estatísticas
    const totalReadings = readings?.length ?? 0;
    const aboveThreshold = readings?.filter?.((r: any) => (r?.valueMgDl ?? 0) > GLUCOSE_THRESHOLD)?.length ?? 0;
    const percentAbove = totalReadings > 0 ? Math.round((aboveThreshold / totalReadings) * 100) : 0;

    const byType: Record<string, { total: number; above: number; percent: number }> = {};
    for (const type of READING_TYPES) {
      const typeReadings = readings?.filter?.((r: any) => r?.readingType === type) ?? [];
      const typeTotal = typeReadings?.length ?? 0;
      const typeAbove = typeReadings?.filter?.((r: any) => (r?.valueMgDl ?? 0) > GLUCOSE_THRESHOLD)?.length ?? 0;
      byType[type] = {
        total: typeTotal,
        above: typeAbove,
        percent: typeTotal > 0 ? Math.round((typeAbove / typeTotal) * 100) : 0,
      };
    }

    // Gerar HTML
    const sortedDates = Object.keys(byDate).sort();
    
    const tableRows = sortedDates.map(date => {
      const dayData = byDate[date] ?? {};
      const cells = READING_TYPES.map(type => {
        const value = dayData[type];
        if (value === undefined || value === null) return '<td style="text-align: center; padding: 8px; border: 1px solid #ddd;">-</td>';
        const isHigh = value > GLUCOSE_THRESHOLD;
        const style = isHigh 
          ? 'background-color: #fecaca; color: #dc2626; font-weight: bold;' 
          : 'background-color: #dcfce7; color: #16a34a;';
        return `<td style="text-align: center; padding: 8px; border: 1px solid #ddd; ${style}">${value}</td>`;
      }).join('');
      return `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: 500;">${formatDateBR(date)}</td>${cells}</tr>`;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #db2777; text-align: center; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #fce7f3; padding: 10px; border: 1px solid #ddd; font-weight: bold; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .stat-label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #db2777; }
          .type-stats { margin-top: 30px; }
          .type-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <h1>Relatório de Glicemia Gestacional</h1>
        <p class="subtitle">Período: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total de Leituras</div>
            <div class="stat-value">${totalReadings}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Acima de ${GLUCOSE_THRESHOLD} mg/dL</div>
            <div class="stat-value" style="color: ${aboveThreshold > 0 ? '#dc2626' : '#16a34a'}">${aboveThreshold}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Percentual Elevado</div>
            <div class="stat-value" style="color: ${percentAbove > 30 ? '#dc2626' : percentAbove > 15 ? '#f59e0b' : '#16a34a'}">${percentAbove}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Dias Registrados</div>
            <div class="stat-value">${sortedDates.length}</div>
          </div>
        </div>

        <h3>Medidas Diárias</h3>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Jejum</th>
              <th>Pós-Café 2h</th>
              <th>Pós-Almoço 2h</th>
              <th>Pós-Janta 2h</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhuma medida registrada</td></tr>'}
          </tbody>
        </table>

        <div class="type-stats">
          <h3>Estatísticas por Tipo de Medida</h3>
          ${READING_TYPES.map(type => {
            const stats = byType[type] ?? { total: 0, above: 0, percent: 0 };
            return `
              <div class="type-row">
                <span>${READING_TYPE_LABELS[type] ?? type}</span>
                <span>${stats.total} medidas | ${stats.above} elevadas | <strong style="color: ${stats.percent > 30 ? '#dc2626' : stats.percent > 15 ? '#f59e0b' : '#16a34a'}">${stats.percent}%</strong> acima de ${GLUCOSE_THRESHOLD}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="footer">
          <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
          <p>Limite de alerta: ${GLUCOSE_THRESHOLD} mg/dL</p>
        </div>
      </body>
      </html>
    `;

    // Chamar API de geração de PDF
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: { format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } },
        base_url: process.env.NEXTAUTH_URL || '',
      }),
    });

    if (!createResponse.ok) {
      return NextResponse.json({ success: false, error: 'Erro ao criar requisição de PDF' }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ success: false, error: 'ID de requisição não retornado' }, { status: 500 });
    }

    // Polling
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status ?? 'FAILED';
      const result = statusResult?.result ?? null;

      if (status === 'SUCCESS' && result?.result) {
        const pdfBuffer = Buffer.from(result.result, 'base64');
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="relatorio_glicemia_${startDate}_${endDate}.pdf"`,
          },
        });
      } else if (status === 'FAILED') {
        return NextResponse.json({ success: false, error: 'Falha na geração do PDF' }, { status: 500 });
      }
      attempts++;
    }

    return NextResponse.json({ success: false, error: 'Timeout na geração do PDF' }, { status: 500 });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ success: false, error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
