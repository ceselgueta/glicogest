'use client';

import { useState } from 'react';
import { Table, ChevronDown, ChevronUp, Trash2, Loader2, Stethoscope, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { READING_TYPES, getReadingTypeLabels, getTargetForType, DEFAULT_FASTING_TARGET, DEFAULT_POST_MEAL_TARGET } from '@/lib/constants';
import { classifyGlucoseAlert, getAlertBadgeColor, getAlertIcon } from '@/lib/alerts';
import type { GlucoseReading, DayReadings, PatientSettings } from '@/lib/types';

interface ReadingsTableProps {
  readings: GlucoseReading[];
  loading: boolean;
  onDelete?: () => void;
  patientSettings?: PatientSettings | null;
  protocol?: string;
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = (dateStr ?? '').split('-');
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`;
}

function parseSymptoms(symptoms: string | null | undefined): string[] {
  if (!symptoms) return [];
  try {
    const parsed = JSON.parse(symptoms);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ReadingsTable({ readings, loading, onDelete, patientSettings, protocol = '2h' }: ReadingsTableProps) {
  const [expanded, setExpanded] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedReading, setExpandedReading] = useState<string | null>(null);

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
                      const dayReadings = (readings ?? []).filter(r => r?.readingDate === date);
                      const hasExtraInfo = dayReadings.some(r => r?.symptoms || r?.observations);
                      
                      return (
                        <motion.tr
                          key={date}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                              {formatDateBR(date)}
                              {hasExtraInfo && (
                                <button
                                  onClick={() => setExpandedReading(expandedReading === date ? null : date)}
                                  className="p-1 text-pink-400 hover:text-pink-600 transition-colors"
                                  title="Ver detalhes"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {/* Expanded details */}
                            <AnimatePresence>
                              {expandedReading === date && hasExtraInfo && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2 space-y-1"
                                >
                                  {dayReadings.filter(r => r?.symptoms || r?.observations).map(r => {
                                    const symptoms = parseSymptoms(r.symptoms);
                                    return (
                                      <div key={r.id} className="text-xs bg-gray-50 rounded-lg p-2 space-y-1">
                                        <span className="font-medium text-gray-600">{labels[r.readingType] ?? r.readingType}:</span>
                                        {symptoms.length > 0 && (
                                          <div className="flex items-start gap-1">
                                            <Stethoscope className="w-3 h-3 text-pink-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-500">{symptoms.join(', ')}</span>
                                          </div>
                                        )}
                                        {r.observations && (
                                          <div className="flex items-start gap-1">
                                            <FileText className="w-3 h-3 text-pink-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-500">{r.observations}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                          {READING_TYPES.map(type => {
                            const value = (dayData as any)?.[type];
                            const reading = readings?.find?.(
                              r => r?.readingDate === date && r?.readingType === type
                            );
                            const target = getTargetForType(type, fastingTarget, postMealTarget);
                            
                            if (value === null || value === undefined) {
                              return (
                                <td key={type} className="px-4 py-3 text-center">
                                  <span className="text-gray-300">-</span>
                                </td>
                              );
                            }

                            const alert = classifyGlucoseAlert(value, type, fastingTarget, postMealTarget);
                            const badgeColor = getAlertBadgeColor(alert.level);
                            const alertIcon = getAlertIcon(alert.level);
                            const readingSymptoms = reading ? parseSymptoms(reading.symptoms) : [];
                            
                            return (
                              <td key={type} className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${badgeColor}`}
                                    title={alert.title}
                                  >
                                    <span className="text-xs">{alertIcon}</span>
                                    {value}
                                  </span>
                                  {readingSymptoms.length > 0 && (
                                    <span title={`Sintomas: ${readingSymptoms.join(', ')}`}>
                                      <Stethoscope className="w-3.5 h-3.5 text-pink-400" />
                                    </span>
                                  )}
                                  {reading && onDelete && (
                                    <button
                                      onClick={() => handleDelete(reading)}
                                      disabled={deleting === reading?.id}
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                      title="Excluir"
                                    >
                                      {deleting === reading?.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
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
