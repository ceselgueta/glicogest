export type PlanId = 'free_trial' | 'monthly' | 'quarterly' | 'gestation_full';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  buttonText: string;
  highlight: boolean;
  badge?: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'free_trial',
    name: 'Teste Grátis',
    price: 0,
    durationDays: 4,
    description: 'Experimente o sistema completo por 4 dias.',
    features: [
      'Cadastro da paciente',
      'Registros de glicemia liberados',
      'Dashboard com estatísticas',
      'Metas personalizadas',
      'Protocolo 1h ou 2h após refeições',
      '3 relatórios PDF de teste',
    ],
    buttonText: 'Começar teste grátis',
    highlight: false,
  },
  {
    id: 'monthly',
    name: 'Mensal',
    price: 14.90,
    durationDays: 30,
    description: 'Para acompanhamento por 30 dias.',
    features: [
      'Registros ilimitados',
      'Dashboard completo',
      'Relatórios PDF ilimitados',
      'Histórico completo',
      'Filtros por período',
      'Metas personalizadas',
      'Protocolo 1h ou 2h após refeições',
    ],
    buttonText: 'Escolher plano mensal',
    highlight: false,
  },
  {
    id: 'quarterly',
    name: '3 Meses',
    price: 34.90,
    durationDays: 90,
    description: 'Ideal para quem precisa acompanhar parte da gestação.',
    features: [
      'Registros ilimitados por 90 dias',
      'Dashboard completo',
      'Relatórios PDF ilimitados',
      'Histórico completo',
      'Filtros por período',
      'Metas personalizadas',
      'Protocolo 1h ou 2h após refeições',
    ],
    buttonText: 'Escolher plano 3 meses',
    highlight: false,
  },
  {
    id: 'gestation_full',
    name: 'Gestação Completa',
    price: 59.90,
    durationDays: 270,
    description: 'Use durante toda a gestação com registros e relatórios ilimitados.',
    features: [
      'Acesso por até 9 meses',
      'Registros ilimitados',
      'Dashboard completo',
      'Relatórios PDF ilimitados',
      'Histórico completo',
      'Filtros por período',
      'Metas personalizadas',
      'Protocolo 1h ou 2h após refeições',
    ],
    buttonText: 'Escolher gestação completa',
    highlight: true,
    badge: 'Mais recomendado',
  },
];

export function getPlanById(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}

export interface PlanStatus {
  plan: string;
  planExpiresAt: string | null;
  planStartedAt: string | null;
  hasUsedTrial: boolean;
  pdfReportsGenerated: number;
  paymentStatus: string;
  isActive: boolean;
  daysRemaining: number;
  canRegisterReadings: boolean;
  canGeneratePdf: boolean;
  pdfLimit: number | null; // null = unlimited
  statusLabel: string;
}

export function computePlanStatus(user: {
  plan: string;
  planExpiresAt: string | Date | null;
  planStartedAt?: string | Date | null;
  hasUsedTrial?: boolean;
  pdfReportsGenerated?: number;
  paymentStatus?: string;
}): PlanStatus {
  const now = new Date();
  const plan = user.plan || 'free';
  const expiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
  const startedAt = user.planStartedAt ? new Date(user.planStartedAt) : null;
  const hasUsedTrial = user.hasUsedTrial ?? false;
  const pdfReportsGenerated = user.pdfReportsGenerated ?? 0;
  const paymentStatus = user.paymentStatus ?? 'not_required';

  // Legacy "premium" plan - treat as active paid plan
  if (plan === 'premium') {
    const isActive = !expiresAt || expiresAt > now;
    const daysRemaining = expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 999;
    return {
      plan,
      planExpiresAt: expiresAt?.toISOString() ?? null,
      planStartedAt: startedAt?.toISOString() ?? null,
      hasUsedTrial,
      pdfReportsGenerated,
      paymentStatus,
      isActive,
      daysRemaining,
      canRegisterReadings: isActive,
      canGeneratePdf: isActive,
      pdfLimit: null,
      statusLabel: isActive ? 'Plano Premium ativo' : 'Plano expirado',
    };
  }

  // Free plan (no trial started, no paid plan)
  if (plan === 'free') {
    return {
      plan,
      planExpiresAt: null,
      planStartedAt: null,
      hasUsedTrial,
      pdfReportsGenerated,
      paymentStatus,
      isActive: false,
      daysRemaining: 0,
      canRegisterReadings: false,
      canGeneratePdf: false,
      pdfLimit: 0,
      statusLabel: hasUsedTrial ? 'Teste grátis utilizado' : 'Sem plano ativo',
    };
  }

  // Free trial
  if (plan === 'free_trial') {
    const isActive = expiresAt ? expiresAt > now : false;
    const daysRemaining = expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    return {
      plan,
      planExpiresAt: expiresAt?.toISOString() ?? null,
      planStartedAt: startedAt?.toISOString() ?? null,
      hasUsedTrial: true,
      pdfReportsGenerated,
      paymentStatus: 'not_required',
      isActive,
      daysRemaining,
      canRegisterReadings: isActive,
      canGeneratePdf: isActive && pdfReportsGenerated < 3,
      pdfLimit: 3,
      statusLabel: isActive
        ? `Teste grátis: ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
        : 'Teste grátis expirado',
    };
  }

  // Paid plans (monthly, quarterly, gestation_full)
  const isActive = expiresAt ? expiresAt > now : false;
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const planDef = getPlanById(plan);
  const planName = planDef?.name ?? plan;

  return {
    plan,
    planExpiresAt: expiresAt?.toISOString() ?? null,
    planStartedAt: startedAt?.toISOString() ?? null,
    hasUsedTrial,
    pdfReportsGenerated,
    paymentStatus,
    isActive,
    daysRemaining,
    canRegisterReadings: isActive,
    canGeneratePdf: isActive,
    pdfLimit: null,
    statusLabel: isActive
      ? `${planName}: ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
      : `Plano ${planName} expirado`,
  };
}

export function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
