'use client';

import { useState } from 'react';
import { Table, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { READING_TYPES, getReadingTypeLabels, getTargetForType, DEFAULT_FASTING_TARGET, DEFAULT_POST_MEAL_TARGET } from '@/lib/constants';
import type { GlucoseReading, DayReadings, PatientSettings } from '@/lib/types';

interface ReadingsTableProps {
  readings: GlucoseReading[];
  loading: boolean;
  onDelete: () => void;
  patientSettings?: PatientSettings | null;
  protocol?: string;
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = (dateStr ?? '').split('-');
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`;
}

export default function ReadingsTable({ readings, loading, onDelete, patientSettings, protocol = '2h' }: ReadingsTableProps) {
  const [expanded, setExpanded] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const labels = getReadingTypeLabels(protocol);
  const fastingTarget = patientSettings?.fastingTarget ?? DEFAULT_FASTING_TARGET;
  const postMealTarget = patientSettings?.postMealTarget ?? DEFAULT_POST_MEAL_TARGET;

  const groupedByDate = (readings ?? []).reduce((acc: Record<string, DayReadings>, r) => {
    const date = r?.readingDate ?? '';
    if (!acc[date]) {
      acc[date] = { date, JEJUM: null, POS_CAFE_2H: null, POS_ALMOCO_2H: null, POS_JANTA_2H: null };
    }
    if (r?.readingType) {
      (acc[date] as any)[r.readingType] = r?.valueMgDl ?? null;
    }
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const handleDelete = async (reading: GlucoseReading) => {
    if (!confirm('Excluir esta medida?')) return;
    
    setDeleting(reading?.id ?? '');
    try {
      const res = await fetch(`/api/readings/${reading?.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        toast.success('Medida excluída');
        onDelete?.();
      } else {
        toast.error(data?.error ?? 'Erro ao excluir');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 card-shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl card-shadow overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Table className="w-6 h-6 text-pink-500" />
          Histórico de Medidas
        </h2>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {sortedDates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Table className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma medida registrada neste período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-pink-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                      {READING_TYPES.map(type => (
                        <th key={type} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                          {labels[type] ?? type}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDates.map((date, index) => {
                      const dayData = groupedByDate[date] ?? {};
                      return (
                        <motion.tr
                          key={date}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {formatDateBR(date)}
                          </td>
                          {READING_TYPES.map(type => {
                            const value = (dayData as any)?.[type];
                            const reading = readings?.find?.(
                              r => r?.readingDate === date && r?.readingType === type
                            );
                            const target = getTargetForType(type, fastingTarget, postMealTarget);
                            const isHigh = value !== null && value !== undefined && value > target;
                            
                            return (
                              <td key={type} className="px-4 py-3 text-center">
                                {value !== null && value !== undefined ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span
                                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        isHigh
                                          ? 'bg-red-100 text-red-600'
                                          : 'bg-green-100 text-green-600'
                                      }`}
                                    >
                                      {value}
                                    </span>
                                    {reading && (
                                      <button
                                        onClick={() => handleDelete(reading)}
                                        disabled={deleting === reading?.id}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Excluir"
                                      >
                                        {deleting === reading?.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
