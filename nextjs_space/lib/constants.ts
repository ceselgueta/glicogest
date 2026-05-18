// Limites padrão por protocolo (baseados nas diretrizes SBD/FEBRASGO/OPAS 2025)
export const DEFAULT_FASTING_TARGET = 95;
export const DEFAULT_POST_MEAL_TARGET_2H = 120; // Meta para protocolo 2h após refeição
export const DEFAULT_POST_MEAL_TARGET_1H = 140; // Meta para protocolo 1h após refeição
export const DEFAULT_POST_MEAL_TARGET = 120;    // Fallback (2h é o padrão)

// Limites de validação (amplos para não impedir registro de valores extremos)
export const MIN_GLUCOSE = 1;
export const MAX_GLUCOSE = 999;

// Retorna a meta pós-refeição correta baseada no protocolo
export function getPostMealTarget(protocol: string = '2h'): number {
  return protocol === '1h' ? DEFAULT_POST_MEAL_TARGET_1H : DEFAULT_POST_MEAL_TARGET_2H;
}

// Labels para tipos de medida - dinâmicos baseados no protocolo
export function getReadingTypeLabels(protocol: string = '2h'): Record<string, string> {
  const suffix = protocol === '1h' ? '1h' : '2h';
  return {
    JEJUM: 'Em Jejum',
    POS_CAFE_2H: `Pós-Café ${suffix}`,
    POS_ALMOCO_2H: `Pós-Almoço ${suffix}`,
    POS_JANTA_2H: `Pós-Janta ${suffix}`,
  };
}

// Labels estáticos (compatibilidade - usa 2h como padrão)
export const READING_TYPE_LABELS: Record<string, string> = getReadingTypeLabels('2h');

export const READING_TYPES = ['JEJUM', 'POS_CAFE_2H', 'POS_ALMOCO_2H', 'POS_JANTA_2H'] as const;

export type ReadingTypeKey = typeof READING_TYPES[number];

// Helpers para determinar a meta correta de cada tipo de medida
export function getTargetForType(
  type: string,
  fastingTarget: number,
  postMealTarget: number
): number {
  if (type === 'JEJUM') return fastingTarget;
  return postMealTarget;
}
