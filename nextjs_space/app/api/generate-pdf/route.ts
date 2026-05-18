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
    // Meta pós-refeição baseada no protocolo: 1h = 140, 2h = 120 (SBD/FEBRASGO 2025)
  const defaultPmt = protocol === '1h' ? 140 : 120;
  const postMealTarget = patientSettings?.postMealTarget ?? defaultPmt;
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
      <div style="background: #fdf2f8; border: 1px solid #fce7f3; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #db2777; margin-bottom: 12px;">Dados da Paciente</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; color: #374151;">
          <div><span style="color: #9ca3af; font-size: 11px; display: block; margin-bottom: 2px;">Nome</span><strong style="color: #111827;">${patientSettings.patientName}</strong></div>
          ${patientSettings.pregnancyWeeks ? `<div><span style="color: #9ca3af; font-size: 11px; display: block; margin-bottom: 2px;">Semana gestacional</span><strong style="color: #111827;">${patientSettings.pregnancyWeeks}ª semana</strong></div>` : '<div></div>'}
          ${patientSettings.estimatedDueDate ? `<div><span style="color: #9ca3af; font-size: 11px; display: block; margin-bottom: 2px;">Data provável do parto</span><strong style="color: #111827;">${formatDateBR(patientSettings.estimatedDueDate.toISOString().split('T')[0])}</strong></div>` : '<div></div>'}
          ${patientSettings.doctorName ? `<div><span style="color: #9ca3af; font-size: 11px; display: block; margin-bottom: 2px;">Obstetra</span><strong style="color: #111827;">Dr(a). ${patientSettings.doctorName}</strong></div>` : '<div></div>'}
          <div><span style="color: #9ca3af; font-size: 11px; display: block; margin-bottom: 2px;">Protocolo</span><strong style="color: #111827;">${protocol === '1h' ? '1 hora' : '2 horas'} após refeições</strong></div>
          <div><span style="color: #9ca3af; font-size: 11px; display: block; margin-bottom: 2px;">Metas glicêmicas</span><strong style="color: #111827;">Jejum ≤${fastingTarget} · Pós-ref. ≤${postMealTarget} mg/dL</strong></div>
        </div>
      </div>
    ` : '';

    // Gerar HTML
    const sortedDates = Object.keys(byDate).sort();
    
    const tableRows = sortedDates.map(date => {
      const dayData = byDate[date] ?? {};
      const cells = READING_TYPES.map(type => {
        const value = dayData[type];
        const target = getTargetForType(type, fastingTarget, postMealTarget);
        if (value === undefined || value === null) return '<td class="empty">—</td>';
        const isHigh = value > target;
        const isHypo = value < 70;
        let cls = 'normal';
        if (isHypo) {
          cls = value < 54 ? 'hypo-severe' : 'hypo';
        } else if (isHigh) {
          cls = 'high';
        }
        return `<td class="${cls}">${value}</td>`;
      }).join('');
      return `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: 500;">${formatDateBR(date)}</td>${cells}</tr>`;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 32px 36px; color: #111827; background: white; font-size: 13px; line-height: 1.5; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #fce7f3; }
          .header-left h1 { font-size: 22px; font-weight: 700; color: #be185d; margin-bottom: 4px; }
          .header-left .periodo { font-size: 13px; color: #6b7280; }
          .header-right { text-align: right; }
          .header-right .logo { font-size: 18px; font-weight: 800; color: #db2777; letter-spacing: -0.5px; }
          .header-right .gerado { font-size: 11px; color: #9ca3af; margin-top: 4px; }

          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
          .stat-card { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 14px 16px; }
          .stat-label { font-size: 11px; color: #6b7280; font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
          .stat-value { font-size: 28px; font-weight: 700; line-height: 1; }

          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #374151; margin-bottom: 12px; margin-top: 24px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
          th { background: #fdf2f8; color: #be185d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 12px; text-align: center; border: 1px solid #fce7f3; }
          th.date-col { text-align: left; }
          td { padding: 9px 12px; border: 1px solid #f3f4f6; text-align: center; font-size: 13px; font-weight: 600; }
          td.date-cell { text-align: left; font-weight: 500; color: #374151; font-size: 12px; }
          tr:nth-child(even) td { background: #fafafa; }
          tr:nth-child(even) td.normal { background: #f0fdf4; }
          tr:nth-child(even) td.high { background: #fef2f2; }
          tr:nth-child(even) td.hypo { background: #fff7ed; }

          td.normal { background: #f0fdf4; color: #15803d; }
          td.high { background: #fef2f2; color: #dc2626; }
          td.hypo-severe { background: #fef2f2; color: #dc2626; }
          td.hypo { background: #fff7ed; color: #ea580c; }
          td.empty { color: #d1d5db; background: white; font-weight: 400; }

          .type-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px; }
          .type-stat-card { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
          .type-stat-name { font-size: 12px; color: #374151; font-weight: 600; }
          .type-stat-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
          .type-stat-right { text-align: right; }
          .type-stat-pct { font-size: 18px; font-weight: 700; line-height: 1; }
          .type-stat-detail { font-size: 11px; color: #6b7280; margin-top: 2px; }

          .events-table th { font-size: 11px; }
          .events-table td { font-size: 12px; font-weight: 400; text-align: left; }
          .events-table td.val-cell { text-align: center; font-weight: 700; }

          .legend { display: flex; gap: 16px; margin-top: 8px; margin-bottom: 20px; flex-wrap: wrap; }
          .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6b7280; }
          .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
          .footer-disclaimer { font-size: 11px; color: #9ca3af; max-width: 70%; line-height: 1.4; }
          .footer-brand { font-size: 13px; font-weight: 700; color: #db2777; }

          @media print {
            body { padding: 20px 24px; }
            .stats-grid { grid-template-columns: repeat(4, 1fr); }
          }
        </style>
      </head>
      <body>
        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <h1>Relatório de Glicemia Gestacional</h1>
            <div class="periodo">Período de análise: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}</div>
          </div>
          <div class="header-right">
            <div class="logo">GlicoGest</div>
            <div class="gerado">Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        ${patientInfoHtml}

        <!-- STATS -->
        <div class="section-title">Resumo do Período</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total de Leituras</div>
            <div class="stat-value" style="color: #2563eb;">${totalReadings}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Dias Registrados</div>
            <div class="stat-value" style="color: #7c3aed;">${sortedDates.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Acima da Meta</div>
            <div class="stat-value" style="color: ${aboveThreshold > 0 ? '#dc2626' : '#16a34a'};">${aboveThreshold}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">% Elevado</div>
            <div class="stat-value" style="color: ${percentAbove > 30 ? '#dc2626' : percentAbove > 15 ? '#d97706' : '#16a34a'};">${percentAbove}%</div>
          </div>
        </div>

        <!-- LEGENDA -->
        <div class="legend">
          <div class="legend-item"><div class="legend-dot" style="background:#16a34a;"></div> Dentro da meta</div>
          <div class="legend-item"><div class="legend-dot" style="background:#dc2626;"></div> Acima da meta</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ea580c;"></div> Hipoglicemia (&lt;70)</div>
          <div class="legend-item"><div class="legend-dot" style="background:#d1d5db;"></div> Não registrado</div>
        </div>

        <!-- TABELA DIÁRIA -->
        <div class="section-title">Medidas Diárias</div>
        <table>
          <thead>
            <tr>
              <th class="date-col" style="text-align:left; width:90px;">Data</th>
              <th>${labels['JEJUM']}<div style="font-weight:400;font-size:10px;color:#db2777;margin-top:2px;">meta ≤${fastingTarget} mg/dL</div></th>
              <th>${labels['POS_CAFE_2H']}<div style="font-weight:400;font-size:10px;color:#db2777;margin-top:2px;">meta ≤${postMealTarget} mg/dL</div></th>
              <th>${labels['POS_ALMOCO_2H']}<div style="font-weight:400;font-size:10px;color:#db2777;margin-top:2px;">meta ≤${postMealTarget} mg/dL</div></th>
              <th>${labels['POS_JANTA_2H']}<div style="font-weight:400;font-size:10px;color:#db2777;margin-top:2px;">meta ≤${postMealTarget} mg/dL</div></th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 20px; color:#9ca3af;">Nenhuma medida registrada neste período</td></tr>'}
          </tbody>
        </table>

        <!-- STATS POR TIPO -->
        <div class="section-title" style="margin-top:28px;">Estatísticas por Tipo de Medição</div>
        <div class="type-stats-grid">
          ${READING_TYPES.map(type => {
            const stats = byType[type] ?? { total: 0, above: 0, percent: 0, target: 120 };
            const pctColor = stats.percent > 30 ? '#dc2626' : stats.percent > 15 ? '#d97706' : '#16a34a';
            return `
              <div class="type-stat-card">
                <div>
                  <div class="type-stat-name">${labels[type] ?? type}</div>
                  <div class="type-stat-meta">meta ≤${stats.target} mg/dL · ${stats.total} leituras</div>
                </div>
                <div class="type-stat-right">
                  <div class="type-stat-pct" style="color:${pctColor};">${stats.percent}%</div>
                  <div class="type-stat-detail">${stats.above} elevada${stats.above !== 1 ? 's' : ''}</div>
                </div>
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

        <!-- FOOTER -->
        <div class="footer">
          <div class="footer-disclaimer">
            ⚕️ Este relatório é um apoio ao acompanhamento glicêmico e não substitui avaliação ou orientação médica. Consulte sempre seu obstetra.
          </div>
          <div class="footer-brand">GlicoGest</div>
        </div>
      </body>
      </html>
    `;

    // Incrementar contador de PDFs para usuários do trial
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { pdfReportsGenerated: { increment: 1 } },
      });
    } catch (e) {
      console.error('Error incrementing PDF counter:', e);
    }

    // Gerar PDF com @sparticuz/chromium (compatível com Vercel serverless)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromium = await import('@sparticuz/chromium') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const puppeteerCore = await import('puppeteer-core') as any;

    const browser = await puppeteerCore.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'load' });
      const pdfUint8 = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true,
      });
      pdfBuffer = Buffer.from(pdfUint8);
    } finally {
      await browser.close();
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio_glicemia_${startDate}_${endDate}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ success: false, error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
