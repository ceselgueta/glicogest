// Alert classification for gestational glucose readings

export type AlertLevel = 'normal' | 'above_target' | 'hypoglycemia_attention' | 'hypoglycemia_serious' | 'hypoglycemia_emergency' | 'very_high_glucose' | 'high_glucose_emergency';

export interface GlucoseAlert {
  level: AlertLevel;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  title: string;
  message: string;
  isEmergency: boolean;
}

export const SYMPTOMS_LIST = [
  'Tremor',
  'Suor frio',
  'Fraqueza',
  'Tontura',
  'Confusão',
  'Sonolência intensa',
  'Desmaio',
  'Convulsão',
  'Náuseas ou vômitos',
  'Dor abdominal',
  'Respiração difícil',
  'Mal-estar intenso',
];

export const SEVERE_SYMPTOMS = ['Desmaio', 'Convulsão', 'Confusão', 'Sonolência intensa'];

export const MEDICAL_DISCLAIMER_SHORT = 'Este alerta é apenas informativo e não substitui avaliação médica.';
export const MEDICAL_DISCLAIMER_FULL = 'O sistema auxilia no registro e organização das medições de glicemia gestacional. Ele não realiza diagnóstico e não substitui orientação do obstetra, endocrinologista ou serviço de saúde. Em caso de sintomas importantes, valores muito baixos, valores muito altos persistentes ou dúvida sobre conduta, procure atendimento médico.';

export function classifyGlucoseAlert(
  value: number,
  readingType: string,
  fastingTarget: number,
  postMealTarget: number,
  symptoms?: string[]
): GlucoseAlert {
  const target = readingType === 'JEJUM' ? fastingTarget : postMealTarget;
  const hasSevereSymptoms = symptoms?.some(s => SEVERE_SYMPTOMS.includes(s)) ?? false;

  // Emergency: severe symptoms or extremely high (>= 250)
  if (hasSevereSymptoms || value >= 250) {
    return {
      level: 'high_glucose_emergency',
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      icon: '🚨',
      title: 'Alerta de segurança',
      message: value >= 250
        ? 'Glicemia muito alta com sintomas importantes ou cetonas elevadas pode exigir atendimento urgente. Procure atendimento médico imediatamente ou acione o serviço de emergência.'
        : 'Sintomas graves detectados. Procure atendimento médico imediatamente ou acione o serviço de emergência. Não fique sozinha.',
      isEmergency: true,
    };
  }

  // Hypoglycemia emergency (< 40)
  if (value < 40) {
    return {
      level: 'hypoglycemia_emergency',
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      icon: '🚨',
      title: 'Emergência: glicemia extremamente baixa',
      message: 'Glicemia extremamente baixa. Procure atendimento de urgência imediatamente ou acione o serviço de emergência. Não tente dirigir. Se a paciente estiver confusa, desmaiada, convulsionando ou sem conseguir engolir, outra pessoa deve buscar ajuda imediatamente.',
      isEmergency: true,
    };
  }

  // Hypoglycemia serious (< 54)
  if (value < 54) {
    return {
      level: 'hypoglycemia_serious',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      icon: '🔴',
      title: 'Alerta importante: glicemia muito baixa',
      message: 'Glicemia abaixo de 54 mg/dL. Esse valor pode ser perigoso. Siga imediatamente o plano de correção orientado pelo seu médico e não fique sozinha. Se houver confusão, desmaio, sonolência intensa, convulsão ou piora dos sintomas, procure atendimento de urgência.',
      isEmergency: true,
    };
  }

  // Hypoglycemia attention (< 70)
  if (value < 70) {
    return {
      level: 'hypoglycemia_attention',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      icon: '🟠',
      title: 'Atenção: glicemia baixa',
      message: 'Glicemia abaixo de 70 mg/dL. Isso pode indicar hipoglicemia. Siga a orientação passada pelo seu médico. Caso tenha sintomas como tremor, suor frio, fraqueza, tontura, confusão ou mal-estar, corrija conforme orientação médica e meça novamente.',
      isEmergency: false,
    };
  }

  // Very high (>= 200 and < 250)
  if (value >= 200) {
    return {
      level: 'very_high_glucose',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      icon: '🟠',
      title: 'Atenção: glicemia muito elevada',
      message: 'Glicemia muito elevada. Confirme a medição, registre o horário, a refeição e possíveis sintomas. Entre em contato com seu obstetra para orientação, principalmente se esse valor se repetir.',
      isEmergency: false,
    };
  }

  // Above target (> target and < 200)
  if (value > target) {
    return {
      level: 'above_target',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      icon: '🟡',
      title: 'Acima da meta',
      message: 'Valor acima da meta configurada. Registre observações sobre a refeição, horário e sintomas. Acompanhe a tendência nos próximos registros e, em caso de dúvida, fale com seu obstetra.',
      isEmergency: false,
    };
  }

  // Normal
  return {
    level: 'normal',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    icon: '🟢',
    title: 'Dentro da meta',
    message: 'Valor dentro da meta configurada. Continue registrando conforme orientação do seu obstetra.',
    isEmergency: false,
  };
}

export function getAlertBadgeColor(level: AlertLevel): string {
  switch (level) {
    case 'normal': return 'bg-green-100 text-green-700';
    case 'above_target': return 'bg-yellow-100 text-yellow-700';
    case 'hypoglycemia_attention': return 'bg-orange-100 text-orange-700';
    case 'very_high_glucose': return 'bg-orange-100 text-orange-700';
    case 'hypoglycemia_serious': return 'bg-red-100 text-red-700';
    case 'hypoglycemia_emergency': return 'bg-red-200 text-red-800';
    case 'high_glucose_emergency': return 'bg-red-200 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function getAlertIcon(level: AlertLevel): string {
  switch (level) {
    case 'normal': return '🟢';
    case 'above_target': return '🟡';
    case 'hypoglycemia_attention': return '🟠';
    case 'very_high_glucose': return '🟠';
    case 'hypoglycemia_serious': return '🔴';
    case 'hypoglycemia_emergency': return '🚨';
    case 'high_glucose_emergency': return '🚨';
    default: return '⚪';
  }
}
