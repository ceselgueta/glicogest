import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { READING_TYPES, getReadingTypeLabels, getTargetForType, DEFAULT_FASTING_TARGET, DEFAULT_POST_MEAL_TARGET } from '@/lib/constants';
import { getRequiredSession } from '@/lib/get-session';
import { computePlanStatus } from '@/lib/plans';

export const dynamic = 'force-dynamic';

function formatDateBR(dateStr: string): string {
  const [year, month, day] = (dateStr ?? '').split('-');
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`;
}

export async function POST(request: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check plan access for PDF generation
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, planStartedAt: true, hasUsedTrial: true, pdfReportsGenerated: true, paymentStatus: true },
    });
    const planSt = computePlanStatus(userRecord ?? { plan: 'free', planExpiresAt: null });
    if (!planSt.canGeneratePdf) {
      const msg = planSt.plan === 'free_trial' && planSt.pdfLimit !== null && planSt.pdfReportsGenerated >= planSt.pdfLimit
        ? 'Limite de PDF do teste grátis atingido (1 relatório). Escolha um plano para gerar mais relatórios.'
        : 'Seu acesso expirou. Escolha um plano para gerar relatórios.';
      return NextResponse.json({ success: false, error: msg, code: 'PDF_LIMIT' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate } = body ?? {};

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Período não informado' }, { status: 400 });
    }

    // Fetch patient settings for this user
    const patientSettings = await prisma.patientSettings.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const fastingTarget = patientSettings?.fastingTarget ?? DEFAULT_FASTING_TARGET;
    const postMealTarget = patientSettings?.postMealTarget ?? DEFAULT_POST_MEAL_TARGET;
    const protocol = patientSettings?.postMealProtocol ?? '2h';
    const labels = getReadingTypeLabels(protocol);

    const readings = await prisma.gestationalGlucoseReading.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
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

    // Coletar leituras relevantes para a seção de eventos:
    // - Medições com observações ou sintomas registrados
    // - Medições fora do normal (hipoglicemia <70 ou acima da meta)
    const HYPOGLYCEMIA_THRESHOLD = 70;
    const readingsWithNotes = readings.filter((r: any) => {
      const hasObs = r.observations && r.observations.trim().length > 0;
      const hasSym = r.symptoms && r.symptoms.trim().length > 0;
      const target = getTargetForType(r.readingType, fastingTarget, postMealTarget);
      const isAboveTarget = (r.valueMgDl ?? 0) > target;
      const isHypoglycemia = (r.valueMgDl ?? 0) < HYPOGLYCEMIA_THRESHOLD;
      return hasObs || hasSym || isAboveTarget || isHypoglycemia;
    });

    // Estatísticas com metas personalizadas
    const totalReadings = readings?.length ?? 0;
    let aboveThreshold = 0;
    for (const r of readings) {
      const target = getTargetForType(r.readingType, fastingTarget, postMealTarget);
      if ((r?.valueMgDl ?? 0) > target) aboveThreshold++;
    }
    const percentAbove = totalReadings > 0 ? Math.round((aboveThreshold / totalReadings) * 100) : 0;

    const byType: Record<string, { total: number; above: number; percent: number; target: number }> = {};
    for (const type of READING_TYPES) {
      const target = getTargetForType(type, fastingTarget, postMealTarget);
      const typeReadings = readings?.filter?.((r: any) => r?.readingType === type) ?? [];
      const typeTotal = typeReadings?.length ?? 0;
      const typeAbove = typeReadings?.filter?.((r: any) => (r?.valueMgDl ?? 0) > target)?.length ?? 0;
      byType[type] = {
        total: typeTotal,
        above: typeAbove,
        percent: typeTotal > 0 ? Math.round((typeAbove / typeTotal) * 100) : 0,
        target,
      };
    }

    // Patient info HTML
    const patientInfoHtml = patientSettings ? `
      <div style="background: #fdf2f8; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; color: #db2777; font-size: 14px;">Dados da Paciente</h3>
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="padding: 3px 10px 3px 0;"><strong>Nome:</strong> ${patientSettings.patientName}</td>
            ${patientSettings.pregnancyWeeks ? `<td style="padding: 3px 10px 3px 0;"><strong>Semana gestacional:</strong> ${patientSettings.pregnancyWeeks}ª</td>` : ''}
          </tr>
          <tr>
            ${patientSettings.estimatedDueDate ? `<td style="padding: 3px 10px 3px 0;"><strong>Data provável do parto:</strong> ${formatDateBR(patientSettings.estimatedDueDate.toISOString().split('T')[0])}</td>` : '<td></td>'}
            ${patientSettings.doctorName ? `<td style="padding: 3px 10px 3px 0;"><strong>Obstetra:</strong> ${patientSettings.doctorName}</td>` : ''}
          </tr>
          <tr>
            <td style="padding: 3px 10px 3px 0;"><strong>Protocolo:</strong> ${protocol === '1h' ? '1 hora' : '2 horas'} após refeições</td>
            <td style="padding: 3px 10px 3px 0;"><strong>Metas:</strong> Jejum ≤${fastingTarget} | Pós-ref. ≤${postMealTarget} mg/dL</td>
          </tr>
        </table>
      </div>
    ` : '';

    // Gerar HTML
    const sortedDates = Object.keys(byDate).sort();
    
    const tableRows = sortedDates.map(date => {
      const dayData = byDate[date] ?? {};
      const cells = READING_TYPES.map(type => {
        const value = dayData[type];
        const target = getTargetForType(type, fastingTarget, postMealTarget);
        if (value === undefined || value === null) return '<td style="text-align: center; padding: 8px; border: 1px solid #ddd;">-</td>';
        const isHigh = value > target;
        const isHypo = value < 70;
        let style = 'background-color: #dcfce7; color: #16a34a;'; // normal/dentro da meta
        if (isHypo) {
          style = value < 54
            ? 'background-color: #fecaca; color: #dc2626; font-weight: bold;' // hipoglicemia grave
            : 'background-color: #fed7aa; color: #ea580c; font-weight: bold;'; // hipoglicemia
        } else if (isHigh) {
          style = 'background-color: #fecaca; color: #dc2626; font-weight: bold;'; // acima da meta
        }
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
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
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
        
        ${patientInfoHtml}

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total de Leituras</div>
            <div class="stat-value">${totalReadings}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Acima da meta</div>
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
              <th>${labels['JEJUM']}<br><small style="font-weight:normal;color:#888;">meta ≤${fastingTarget}</small></th>
              <th>${labels['POS_CAFE_2H']}<br><small style="font-weight:normal;color:#888;">meta ≤${postMealTarget}</small></th>
              <th>${labels['POS_ALMOCO_2H']}<br><small style="font-weight:normal;color:#888;">meta ≤${postMealTarget}</small></th>
              <th>${labels['POS_JANTA_2H']}<br><small style="font-weight:normal;color:#888;">meta ≤${postMealTarget}</small></th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhuma medida registrada</td></tr>'}
          </tbody>
        </table>

        <div class="type-stats">
          <h3>Estatísticas por Tipo de Medida</h3>
          ${READING_TYPES.map(type => {
            const stats = byType[type] ?? { total: 0, above: 0, percent: 0, target: 120 };
            return `
              <div class="type-row">
                <span>${labels[type] ?? type} (meta ≤${stats.target})</span>
                <span>${stats.total} medidas | ${stats.above} elevadas | <strong style="color: ${stats.percent > 30 ? '#dc2626' : stats.percent > 15 ? '#f59e0b' : '#16a34a'}">${stats.percent}%</strong> acima da meta</span>
              </div>
            `;
          }).join('')}
        </div>

        ${readingsWithNotes.length > 0 ? `
        <div style="margin-top: 30px; page-break-inside: avoid;">
          <h3 style="color: #db2777;">Eventos e Observações</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 12px;">Medições fora do intervalo normal (hipoglicemia &lt;70 mg/dL ou acima da meta) e registros com sintomas ou observações informados pela paciente.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="background-color: #fce7f3; padding: 8px; border: 1px solid #ddd; text-align: left; width: 75px;">Data</th>
                <th style="background-color: #fce7f3; padding: 8px; border: 1px solid #ddd; text-align: left; width: 90px;">Medição</th>
                <th style="background-color: #fce7f3; padding: 8px; border: 1px solid #ddd; text-align: center; width: 55px;">Valor</th>
                <th style="background-color: #fce7f3; padding: 8px; border: 1px solid #ddd; text-align: left; width: 90px;">Situação</th>
                <th style="background-color: #fce7f3; padding: 8px; border: 1px solid #ddd; text-align: left;">Sintomas</th>
                <th style="background-color: #fce7f3; padding: 8px; border: 1px solid #ddd; text-align: left;">Observações</th>
              </tr>
            </thead>
            <tbody>
              ${readingsWithNotes.map((r: any) => {
                const dateStr = r.readingDate?.toISOString?.()?.split?.('T')?.[0] ?? '';
                const target = getTargetForType(r.readingType, fastingTarget, postMealTarget);
                const val = r.valueMgDl ?? 0;
                const isHigh = val > target;
                const isHypo = val < 70;
                let valueStyle = 'background-color: #dcfce7; color: #16a34a;';
                if (isHypo) {
                  valueStyle = val < 54
                    ? 'background-color: #fecaca; color: #dc2626; font-weight: bold;'
                    : 'background-color: #fed7aa; color: #ea580c; font-weight: bold;';
                } else if (isHigh) {
                  valueStyle = 'background-color: #fecaca; color: #dc2626; font-weight: bold;';
                }

                let symptomsText = '';
                if (r.symptoms && r.symptoms.trim()) {
                  try {
                    const parsed = JSON.parse(r.symptoms);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      symptomsText = parsed.join(', ');
                    }
                  } catch {
                    symptomsText = r.symptoms;
                  }
                }

                const obsText = r.observations?.trim() ?? '';
                const label = labels[r.readingType] ?? r.readingType;

                // Determine situation label
                let situationText = '';
                let situationStyle = '';
                if (val < 54) {
                  situationText = 'Hipoglicemia grave';
                  situationStyle = 'color: #dc2626; font-weight: bold;';
                } else if (val < 70) {
                  situationText = 'Hipoglicemia';
                  situationStyle = 'color: #ea580c; font-weight: bold;';
                } else if (isHigh) {
                  situationText = 'Acima da meta';
                  situationStyle = 'color: #dc2626;';
                } else {
                  situationText = 'Com observação';
                  situationStyle = 'color: #666;';
                }

                return '<tr>'
                  + '<td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">' + formatDateBR(dateStr) + '</td>'
                  + '<td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">' + label + '</td>'
                  + '<td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px; ' + valueStyle + '">' + r.valueMgDl + ' mg/dL</td>'
                  + '<td style="padding: 8px; border: 1px solid #ddd; font-size: 12px; ' + situationStyle + '">' + situationText + '</td>'
                  + '<td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">' + (symptomsText || '-') + '</td>'
                  + '<td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">' + (obsText || '-') + '</td>'
                  + '</tr>';
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Este relatório é apenas um apoio para acompanhamento glicêmico gestacional e não substitui avaliação médica.</p>
          <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
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
        // Increment PDF counter for trial users
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { pdfReportsGenerated: { increment: 1 } },
          });
        } catch (e) {
          console.error('Error incrementing PDF counter:', e);
        }
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
