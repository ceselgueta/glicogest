import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d?.toLocaleDateString?.('pt-BR') ?? '';
}

export function formatDateISO(date: Date): string {
  return date?.toISOString?.()?.split?.('T')?.[0] ?? '';
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = (dateStr ?? '').split('-').map(Number);
  return new Date(year ?? 2024, (month ?? 1) - 1, day ?? 1);
}

export function getDateRange(filter: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  let start = new Date();
  
  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case '14days':
      start.setDate(start.getDate() - 13);
      start.setHours(0, 0, 0, 0);
      break;
    case '30days':
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      if (customStart && customEnd) {
        start = parseLocalDate(customStart);
        start.setHours(0, 0, 0, 0);
        const customEndDate = parseLocalDate(customEnd);
        customEndDate.setHours(23, 59, 59, 999);
        return { start, end: customEndDate };
      }
      break;
  }
  
  return { start, end };
}
