import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = 'GlicoGest <noreply@glicogest.com.br>';
const BASE_URL = 'https://www.glicogest.com.br';

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[Email] RESEND_API_KEY não configurado — email não enviado para ${to}`);
    return false;
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    if ((result as any)?.error) {
      console.error(`[Email] Resend retornou erro para ${to}:`, JSON.stringify((result as any).error));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Email] Exceção ao enviar para ${to}:`, err);
    return false;
  }
}

// Retorna true se o email foi enviado com sucesso, false se falhou
export async function sendVerificationEmail(to: string, name: string | null | undefined, token: string): Promise<boolean> {
  const first = name?.split(' ')[0] || 'querida';
  return send(to, 'Confirme seu email para ativar o GlicoGest', verificationHtml(first, token));
}

export async function sendWelcomeEmail(to: string, name?: string | null) {
  const first = name?.split(' ')[0] || 'querida';
  await send(to, 'Bem-vinda ao GlicoGest! 🌸 Veja como começar', welcomeHtml(first));
}

export async function sendReminderEmail(to: string, name?: string | null) {
  const first = name?.split(' ')[0] || 'querida';
  await send(to, 'Registrou suas medições hoje? 📊', reminderHtml(first));
}

export async function sendTrialExpiringEmail(to: string, name?: string | null) {
  const first = name?.split(' ')[0] || 'querida';
  await send(to, '⏰ Seu teste termina amanhã — garanta seus dados', trialExpiringHtml(first));
}

// ─── Templates ───────────────────────────────────────────────────────────────

function verificationHtml(first: string, token: string) {
  const link = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  return wrapper(`
    <h2 style="color:#1f2937;font-size:22px;font-weight:700;margin:0 0 8px;">Olá, ${first}! 🌸</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">Sua conta no GlicoGest foi criada! Confirme seu email para ativar seu <strong style="color:#ec4899;">teste grátis de 4 dias</strong>.</p>

    <div style="background:#fdf2f8;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="color:#374151;font-weight:700;font-size:14px;margin:0 0 12px;">Clique no botão abaixo para confirmar:</p>
      ${btn(link, 'Confirmar meu email →')}
      <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">O link é válido por 48 horas.</p>
    </div>

    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">Se você não criou esta conta, ignore este email.</p>
  `);
}

function wrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GlicoGest</title></head>
<body style="margin:0;padding:0;background:#fdf2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ec4899,#f43f5e);padding:28px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:24px;">🌸</span>
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">GlicoGest</span>
            </div>
            <p style="color:#fce7f3;font-size:13px;margin:0;">Glicemia gestacional organizada</p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fdf2f8;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">GlicoGest · glicogest.com.br</p>
            <p style="color:#9ca3af;font-size:11px;margin:0;">⚕️ Este app não substitui orientação médica. Consulte sempre seu obstetra.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, text: string) {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#f43f5e);color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin:16px 0;">${text}</a>`;
}

function welcomeHtml(first: string) {
  return wrapper(`
    <h2 style="color:#1f2937;font-size:22px;font-weight:700;margin:0 0 8px;">Olá, ${first}! 🎉</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">Sua conta no GlicoGest foi criada com sucesso. Você tem <strong style="color:#ec4899;">4 dias de teste grátis</strong> para usar o sistema completo.</p>

    <div style="background:#fdf2f8;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#374151;font-weight:700;font-size:14px;margin:0 0 12px;">📋 Como começar em 3 passos:</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 8px;"><span style="background:#ec4899;color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">1</span>Acesse o dashboard e <strong>cadastre seus dados</strong> (nome, semana, obstetra, protocolo)</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 8px;"><span style="background:#ec4899;color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">2</span>Registre sua <strong>primeira medição</strong> (jejum, pós-café, pós-almoço ou pós-janta)</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;"><span style="background:#ec4899;color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-right:8px;">3</span>Gere um <strong>relatório PDF</strong> para levar na próxima consulta</p>
    </div>

    <div style="text-align:center;">
      ${btn(`${BASE_URL}/dashboard`, 'Acessar meu dashboard →')}
    </div>

    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0;">Dúvidas? Fale com a gente: <a href="mailto:glicogestcontrole@gmail.com" style="color:#ec4899;">glicogestcontrole@gmail.com</a></p>
  `);
}

function reminderHtml(first: string) {
  return wrapper(`
    <h2 style="color:#1f2937;font-size:22px;font-weight:700;margin:0 0 8px;">Oi, ${first}! 👋</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">Você está usando o GlicoGest há 2 dias. Já registrou as medições de hoje?</p>

    <div style="background:#fdf2f8;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#374151;font-weight:700;font-size:14px;margin:0 0 10px;">💡 Lembre-se de registrar:</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 6px;">🌅 <strong>Jejum</strong> — logo ao acordar, antes de comer</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 6px;">☕ <strong>Pós-café</strong> — 1h ou 2h após o café da manhã</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 6px;">🥗 <strong>Pós-almoço</strong> — 1h ou 2h após o almoço</p>
      <p style="color:#6b7280;font-size:14px;margin:0;">🍽️ <strong>Pós-janta</strong> — 1h ou 2h após o jantar</p>
    </div>

    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Quanto mais dias você registrar, mais completo fica o relatório para a sua obstetra. 📊</p>

    <div style="text-align:center;">
      ${btn(`${BASE_URL}/dashboard`, 'Registrar medições agora →')}
    </div>
  `);
}

function trialExpiringHtml(first: string) {
  return wrapper(`
    <h2 style="color:#1f2937;font-size:22px;font-weight:700;margin:0 0 8px;">⏰ ${first}, seu teste termina amanhã</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">Seus 4 dias de teste grátis estão quase acabando. <strong>Seus dados já registrados ficam salvos</strong> — mas você precisará de um plano para continuar registrando novas medições.</p>

    <div style="background:#fdf2f8;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#374151;font-weight:700;font-size:15px;margin:0 0 14px;">🌸 Escolha seu plano e continue sem interrupção:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px;background:#fff;border-radius:10px;border:1px solid #fce7f3;text-align:center;width:30%;">
            <p style="color:#ec4899;font-weight:700;font-size:18px;margin:0;">R$14,90</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">30 dias</p>
          </td>
          <td width="8"></td>
          <td style="padding:8px;background:#fff;border-radius:10px;border:2px solid #ec4899;text-align:center;width:30%;">
            <p style="color:#6b7280;font-size:10px;font-weight:700;margin:0;text-transform:uppercase;">Mais escolhido</p>
            <p style="color:#ec4899;font-weight:700;font-size:18px;margin:2px 0;">R$34,90</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">3 meses</p>
          </td>
          <td width="8"></td>
          <td style="padding:8px;background:#fff;border-radius:10px;border:1px solid #fce7f3;text-align:center;width:30%;">
            <p style="color:#ec4899;font-weight:700;font-size:18px;margin:0;">R$59,90</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">9 meses</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;">
      ${btn(`${BASE_URL}/planos`, 'Ver planos e garantir acesso →')}
    </div>

    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0;">Não está pronta para assinar? Seus dados ficam salvos por 90 dias após o término do teste.</p>
  `);
}
