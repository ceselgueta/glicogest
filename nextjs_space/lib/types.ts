export interface GlucoseReading {
  id: string;
  readingDate: string;
  readingType: string;
  valueMgDl: number;
  readingTime?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DayReadings {
  date: string;
  JEJUM?: number | null;
  POS_CAFE_2H?: number | null;
  POS_ALMOCO_2H?: number | null;
  POS_JANTA_2H?: number | null;
}

export interface Stats {
  totalReadings: number;
  aboveThreshold: number;
  percentAbove: number;
  byType: {
    JEJUM: { total: number; above: number; percent: number };
    POS_CAFE_2H: { total: number; above: number; percent: number };
    POS_ALMOCO_2H: { total: number; above: number; percent: number };
    POS_JANTA_2H: { total: number; above: number; percent: number };
  };
}

export interface ReadingInput {
  readingDate: string;
  readingType: string;
  valueMgDl: number;
  readingTime?: string;
  notes?: string;
}

export interface PatientSettings {
  id: string;
  patientName: string;
  birthDate: string | null;
  pregnancyWeeks: number | null;
  estimatedDueDate: string | null;
  doctorName: string | null;
  fastingTarget: number;
  postMealTarget: number;
  postMealProtocol: string;
  createdAt: string;
  updatedAt: string;
}
