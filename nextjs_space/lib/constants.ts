// Limite configurável para alertas de glicemia
export const GLUCOSE_THRESHOLD = 120;

// Limites de validação
export const MIN_GLUCOSE = 40;
export const MAX_GLUCOSE = 400;

// Labels para tipos de medida
export const READING_TYPE_LABELS: Record<string, string> = {
  JEJUM: 'Em Jejum',
  POS_CAFE_2H: 'Pós-Café 2h',
  POS_ALMOCO_2H: 'Pós-Almoço 2h',
  POS_JANTA_2H: 'Pós-Janta 2h',
};

export const READING_TYPES = ['JEJUM', 'POS_CAFE_2H', 'POS_ALMOCO_2H', 'POS_JANTA_2H'] as const;

export type ReadingTypeKey = typeof READING_TYPES[number];
