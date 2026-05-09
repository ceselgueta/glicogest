'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Loader2, CheckCircle, AlertCircle, X, AlertTriangle, FileText, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MIN_GLUCOSE, MAX_GLUCOSE, READING_TYPES, getReadingTypeLabels, getTargetForType, DEFAULT_FASTING_TARGET, DEFAULT_POST_MEAL_TARGET } from '@/lib/constants';
import { classifyGlucoseAlert, SYMPTOMS_LIST, MEDICAL_DISCLAIMER_SHORT, MEDICAL_DISCLAIMER_FULL, type GlucoseAlert } from '@/lib/alerts';
import type { GlucoseReading, PatientSettings } from '@/lib/types';

interface ReadingFormProps {
  existingReadings: GlucoseReading[];
  onSave: () => void;
  patientSettings?: PatientSettings | null;
}

function formatDateISO(date: Date): string {
  return date?.toISOString?.()?.split?.('T')?.[0] ?? '';
}

interface AlertModalProps {
  alert: GlucoseAlert;
  value: number;
  readingType: string;
  labels: Record<string, string>;
  symptoms: string[];
  observations: string;
  onSymptomsChange: (symptoms: string[]) => void;
  onObservationsChange: (obs: string) => void;
  onClose: () => void;
  onSaveExtra: () => void;
  savingExtra: boolean;
}

function AlertModal({
  alert, value, readingType, labels,
  symptoms, observations, onSymptomsChange, onObservationsChange,
  onClose, onSaveExtra, savingExtra
}: AlertModalProps) {
  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      onSymptomsChange(symptoms.filter(s => s !== symptom));
    } else {
      onSymptomsChange([...symptoms, symptom]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Alert Header */}
        <div className={`p-5 rounded-t-2xl ${alert.bgColor} border-b-2 ${alert.borderColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{alert.icon}</span>
              <div>
                <h3 className={`text-lg font-bold ${alert.color}`}>{alert.title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {labels[readingType] ?? readingType}: <strong>{value} mg/dL</strong>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Alert Message */}
        <div className="p-5 space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">{alert.message}</p>

          {/* Symptoms Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-pink-500" />
              <h4 className="text-sm font-semibold text-gray-700">Sintomas (opcional)</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS_LIST.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    symptoms.includes(symptom)
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Observations Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-pink-500" />
              <h4 className="text-sm font-semibold text-gray-700">Observações (opcional)</h4>
            </div>
            <textarea
              value={observations}
              onChange={(e) => onObservationsChange(e.target.value)}
              placeholder="Ex: o que comeu, horário da refeição, atividade física, estresse..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 resize-none transition-all"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{observations.length}/500</p>
          </div>

          {/* Medical Disclaimer */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs text-gray-500 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1 text-gray-400" />
              {MEDICAL_DISCLAIMER_SHORT}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
          >
            Fechar
          </button>
          {(symptoms.length > 0 || observations.trim()) && (
            <button
              onClick={onSaveExtra}
              disabled={savingExtra}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-all text-sm shadow-md"
            >
              {savingExtra ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar detalhes
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ReadingForm({ existingReadings, onSave, patientSettings }: ReadingFormProps) {
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

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    alert: GlucoseAlert;
    value: number;
    readingType: string;
    readingId?: string;
  } | null>(null);
  const [modalSymptoms, setModalSymptoms] = useState<string[]>([]);
  const [modalObservations, setModalObservations] = useState('');
  const [savingExtra, setSavingExtra] = useState(false);

  const protocol = patientSettings?.postMealProtocol ?? '2h';
  const fastingTarget = patientSettings?.fastingTarget ?? DEFAULT_FASTING_TARGET;
  const postMealTarget = patientSettings?.postMealTarget ?? DEFAULT_POST_MEAL_TARGET;
  const labels = getReadingTypeLabels(protocol);

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

  const getStatusColor = (value: string, type: string): string => {
    if (!value) return 'border-gray-200 bg-gray-50';
    const num = Number(value);
    if (isNaN(num)) return 'border-gray-200 bg-gray-50';
    
    // Use alert classification for colors
    if (num < 70) return 'border-orange-300 bg-orange-50';
    if (num < 54) return 'border-red-300 bg-red-50';
    
    const target = getTargetForType(type, fastingTarget, postMealTarget);
    if (num > target) {
      if (num >= 200) return 'border-orange-300 bg-orange-50';
      return 'border-yellow-300 bg-yellow-50';
    }
    return 'border-green-300 bg-green-50';
  };

  const getStatusIcon = (value: string, type: string) => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num)) return null;
    
    const alert = classifyGlucoseAlert(num, type, fastingTarget, postMealTarget);
    if (alert.level === 'normal') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (alert.isEmergency) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const showAlertForReading = (value: number, readingType: string, readingId?: string) => {
    const alert = classifyGlucoseAlert(value, readingType, fastingTarget, postMealTarget);
    // Show modal for any non-normal alert
    if (alert.level !== 'normal') {
      setAlertModal({ alert, value, readingType, readingId });
      setModalSymptoms([]);
      setModalObservations('');
    }
  };

  const handleSaveExtra = async () => {
    if (!alertModal?.readingId) return;
    setSavingExtra(true);
    try {
      const res = await fetch(`/api/readings/${alertModal.readingId}/extra`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: modalSymptoms.length > 0 ? JSON.stringify(modalSymptoms) : null,
          observations: modalObservations.trim() || null,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success('Detalhes salvos com sucesso!');
        onSave?.();
      } else {
        toast.error(data?.error ?? 'Erro ao salvar detalhes');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setSavingExtra(false);
      setAlertModal(null);
    }
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
        // Show alert after saving
        showAlertForReading(Number(value), type, data.data?.id);
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
        
        // Show alert for the most critical reading
        const savedReadings = data?.data ?? [];
        let worstAlert: { alert: GlucoseAlert; value: number; type: string; id?: string } | null = null;
        
        for (const saved of savedReadings) {
          const val = saved?.valueMgDl ?? saved?.value_mg_dl;
          const rType = saved?.readingType ?? saved?.reading_type;
          if (val && rType) {
            const alert = classifyGlucoseAlert(val, rType, fastingTarget, postMealTarget);
            if (alert.level !== 'normal') {
              if (!worstAlert || alert.isEmergency || 
                  (alert.level.includes('emergency') && !worstAlert.alert.isEmergency)) {
                worstAlert = { alert, value: val, type: rType, id: saved?.id };
              }
            }
          }
        }
        
        if (worstAlert) {
          setAlertModal({ 
            alert: worstAlert.alert, 
            value: worstAlert.value, 
            readingType: worstAlert.type,
            readingId: worstAlert.id
          });
          setModalSymptoms([]);
          setModalObservations('');
        }
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
    <>
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
          {READING_TYPES.map((type, index) => {
            const target = getTargetForType(type, fastingTarget, postMealTarget);
            const currentValue = values?.[type] ?? '';
            const numVal = Number(currentValue);
            const hasValue = currentValue && !isNaN(numVal);
            const currentAlert = hasValue ? classifyGlucoseAlert(numVal, type, fastingTarget, postMealTarget) : null;
            
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {labels[type] ?? type}
                </label>
                <p className="text-xs text-gray-400 mb-2">Meta: ≤{target} mg/dL</p>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="mg/dL"
                    value={currentValue}
                    onChange={(e) => handleValueChange(type, e.target.value)}
                    className={`w-full px-4 py-3 pr-24 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-pink-300 text-lg font-medium ${getStatusColor(currentValue, type)}`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {getStatusIcon(currentValue, type)}
                    <button
                      onClick={() => saveIndividual(type)}
                      disabled={saving === type || !currentValue}
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
                {currentValue && !validateValue(currentValue) && (
                  <p className="text-xs text-red-500 mt-1">
                    Valor deve estar entre {MIN_GLUCOSE} e {MAX_GLUCOSE}
                  </p>
                )}
                {/* Inline mini alert */}
                {currentAlert && currentAlert.level !== 'normal' && validateValue(currentValue) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mt-2 p-2 rounded-lg text-xs flex items-start gap-1.5 ${currentAlert.bgColor} border ${currentAlert.borderColor}`}
                  >
                    <span className="flex-shrink-0">{currentAlert.icon}</span>
                    <span className={currentAlert.color}>{currentAlert.title}</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
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

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModal && (
          <AlertModal
            alert={alertModal.alert}
            value={alertModal.value}
            readingType={alertModal.readingType}
            labels={labels}
            symptoms={modalSymptoms}
            observations={modalObservations}
            onSymptomsChange={setModalSymptoms}
            onObservationsChange={setModalObservations}
            onClose={() => setAlertModal(null)}
            onSaveExtra={handleSaveExtra}
            savingExtra={savingExtra}
          />
        )}
      </AnimatePresence>
    </>
  );
}
