'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { GLUCOSE_THRESHOLD, MIN_GLUCOSE, MAX_GLUCOSE, READING_TYPE_LABELS, READING_TYPES } from '@/lib/constants';
import type { GlucoseReading, DayReadings } from '@/lib/types';

interface ReadingFormProps {
  existingReadings: GlucoseReading[];
  onSave: () => void;
}

function formatDateISO(date: Date): string {
  return date?.toISOString?.()?.split?.('T')?.[0] ?? '';
}

export default function ReadingForm({ existingReadings, onSave }: ReadingFormProps) {
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [values, setValues] = useState<Record<string, string>>({
    JEJUM: '',
    POS_CAFE_2H: '',
    POS_ALMOCO_2H: '',
    POS_JANTA_2H: '',
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);

  useEffect(() => {
    const dayReadings = (existingReadings ?? []).filter(
      r => r?.readingDate === selectedDate
    );
    
    const newValues: Record<string, string> = {
      JEJUM: '',
      POS_CAFE_2H: '',
      POS_ALMOCO_2H: '',
      POS_JANTA_2H: '',
    };
    const newNotes: Record<string, string> = {};
    
    for (const reading of dayReadings) {
      if (reading?.readingType && reading?.valueMgDl !== undefined) {
        newValues[reading.readingType] = String(reading.valueMgDl);
        newNotes[reading.readingType] = reading?.notes ?? '';
      }
    }
    
    setValues(newValues);
    setNotes(newNotes);
  }, [selectedDate, existingReadings]);

  const handleValueChange = (type: string, value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setValues(prev => ({ ...(prev ?? {}), [type]: numValue }));
  };

  const validateValue = (value: string): boolean => {
    const num = Number(value);
    return !isNaN(num) && num >= MIN_GLUCOSE && num <= MAX_GLUCOSE;
  };

  const getStatusColor = (value: string): string => {
    if (!value) return 'border-gray-200 bg-gray-50';
    const num = Number(value);
    if (isNaN(num)) return 'border-gray-200 bg-gray-50';
    if (num > GLUCOSE_THRESHOLD) return 'border-red-300 bg-red-50';
    return 'border-green-300 bg-green-50';
  };

  const getStatusIcon = (value: string) => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num)) return null;
    if (num > GLUCOSE_THRESHOLD) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const saveIndividual = async (type: string) => {
    const value = values?.[type];
    if (!value) {
      toast.error('Preencha o valor da medida');
      return;
    }
    if (!validateValue(value)) {
      toast.error(`Valor deve estar entre ${MIN_GLUCOSE} e ${MAX_GLUCOSE} mg/dL`);
      return;
    }

    setSaving(type);
    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingDate: selectedDate,
          readingType: type,
          valueMgDl: Number(value),
          notes: notes?.[type] || '',
        }),
      });

      const data = await res.json();
      if (data?.success) {
        toast.success('Medida salva com sucesso!');
        onSave?.();
      } else {
        toast.error(data?.error ?? 'Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setSaving(null);
    }
  };

  const saveBatch = async () => {
    const readings = READING_TYPES
      .filter(type => values?.[type] && validateValue(values[type]))
      .map(type => ({
        readingDate: selectedDate,
        readingType: type,
        valueMgDl: Number(values?.[type]),
        notes: notes?.[type] || '',
      }));

    if (readings.length === 0) {
      toast.error('Preencha ao menos uma medida válida');
      return;
    }

    setSavingBatch(true);
    try {
      const res = await fetch('/api/readings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings }),
      });

      const data = await res.json();
      if (data?.success) {
        toast.success(`${data?.savedCount ?? 0} medida(s) salva(s) com sucesso!`);
        onSave?.();
      } else {
        toast.error(data?.error ?? 'Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setSavingBatch(false);
    }
  };

  const filledCount = READING_TYPES.filter(t => values?.[t]).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 card-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-pink-500" />
          Lançar Medidas
        </h2>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min="2026-01-16"
            max="2026-03-20"
            className="px-3 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {READING_TYPES.map((type, index) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-gray-600 mb-2">
              {READING_TYPE_LABELS[type] ?? type}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="mg/dL"
                value={values?.[type] ?? ''}
                onChange={(e) => handleValueChange(type, e.target.value)}
                className={`w-full px-4 py-3 pr-24 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-pink-300 text-lg font-medium ${getStatusColor(values?.[type] ?? '')}`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {getStatusIcon(values?.[type] ?? '')}
                <button
                  onClick={() => saveIndividual(type)}
                  disabled={saving === type || !values?.[type]}
                  className="p-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  title="Salvar medida"
                >
                  {saving === type ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {values?.[type] && !validateValue(values[type]) && (
              <p className="text-xs text-red-500 mt-1">
                Valor deve estar entre {MIN_GLUCOSE} e {MAX_GLUCOSE}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {filledCount} de 4 medidas preenchidas
        </p>
        <button
          onClick={saveBatch}
          disabled={savingBatch || filledCount === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          {savingBatch ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Salvar Dia Completo
        </button>
      </div>
    </motion.div>
  );
}
