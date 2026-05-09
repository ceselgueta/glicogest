'use client';

import { useState, useEffect } from 'react';
import { User, Calendar, Stethoscope, Target, Clock, Save, Loader2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { PatientSettings } from '@/lib/types';

interface PatientRegistrationProps {
  existingSettings: PatientSettings | null;
  onSave: (settings: PatientSettings) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export default function PatientRegistration({ existingSettings, onSave, onCancel, isEditing = false }: PatientRegistrationProps) {
  const [patientName, setPatientName] = useState(existingSettings?.patientName ?? '');
  const [birthDate, setBirthDate] = useState(existingSettings?.birthDate ?? '');
  const [pregnancyWeeks, setPregnancyWeeks] = useState(existingSettings?.pregnancyWeeks?.toString?.() ?? '');
  const [estimatedDueDate, setEstimatedDueDate] = useState(existingSettings?.estimatedDueDate ?? '');
  const [doctorName, setDoctorName] = useState(existingSettings?.doctorName ?? '');
  const [fastingTarget, setFastingTarget] = useState(existingSettings?.fastingTarget?.toString?.() ?? '95');
  const [postMealTarget, setPostMealTarget] = useState(existingSettings?.postMealTarget?.toString?.() ?? '120');
  const [postMealProtocol, setPostMealProtocol] = useState(existingSettings?.postMealProtocol ?? '2h');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingSettings) {
      setPatientName(existingSettings.patientName ?? '');
      setBirthDate(existingSettings.birthDate ?? '');
      setPregnancyWeeks(existingSettings.pregnancyWeeks?.toString?.() ?? '');
      setEstimatedDueDate(existingSettings.estimatedDueDate ?? '');
      setDoctorName(existingSettings.doctorName ?? '');
      setFastingTarget(existingSettings.fastingTarget?.toString?.() ?? '95');
      setPostMealTarget(existingSettings.postMealTarget?.toString?.() ?? '120');
      setPostMealProtocol(existingSettings.postMealProtocol ?? '2h');
    }
  }, [existingSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      toast.error('Nome da paciente \u00e9 obrigat\u00f3rio');
      return;
    }
    if (!fastingTarget || Number(fastingTarget) < 50 || Number(fastingTarget) > 300) {
      toast.error('Meta em jejum deve estar entre 50 e 300 mg/dL');
      return;
    }
    if (!postMealTarget || Number(postMealTarget) < 50 || Number(postMealTarget) > 300) {
      toast.error('Meta p\u00f3s-refei\u00e7\u00e3o deve estar entre 50 e 300 mg/dL');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          birthDate: birthDate || null,
          pregnancyWeeks: pregnancyWeeks ? Number(pregnancyWeeks) : null,
          estimatedDueDate: estimatedDueDate || null,
          doctorName: doctorName.trim() || null,
          fastingTarget: Number(fastingTarget),
          postMealTarget: Number(postMealTarget),
          postMealProtocol,
        }),
      });

      const data = await res.json();
      if (data?.success && data?.data) {
        toast.success(isEditing ? 'Cadastro atualizado!' : 'Cadastro salvo com sucesso!');
        onSave(data.data);
      } else {
        toast.error(data?.error ?? 'Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro de conex\u00e3o');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl p-8 card-shadow">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg mb-4">
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Editar Cadastro' : 'Cadastro da Paciente'}
            </h1>
            <p className="text-gray-500 mt-2">
              Configure os dados da gestante e o protocolo de medi\u00e7\u00e3o indicado pelo obstetra.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Dados da Paciente
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da paciente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ex: Thayse de Mello"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semana gestacional atual
                  </label>
                  <input
                    type="number"
                    value={pregnancyWeeks}
                    onChange={(e) => setPregnancyWeeks(e.target.value)}
                    placeholder="Ex: 28"
                    min="1"
                    max="45"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data prov\u00e1vel do parto
                  </label>
                  <input
                    type="date"
                    value={estimatedDueDate}
                    onChange={(e) => setEstimatedDueDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    Nome do obstetra
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Ex: Dra. Ana Souza"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Protocolo */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Protocolo de Medi\u00e7\u00e3o
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quando medir ap\u00f3s as refei\u00e7\u00f5es? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPostMealProtocol('1h')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      postMealProtocol === '1h'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    1 hora ap\u00f3s
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostMealProtocol('2h')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      postMealProtocol === '2h'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    2 horas ap\u00f3s
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Escolha se as medi\u00e7\u00f5es ap\u00f3s as refei\u00e7\u00f5es ser\u00e3o feitas 1 hora ou 2 horas depois, conforme orienta\u00e7\u00e3o m\u00e9dica.
                </p>
              </div>
            </div>

            {/* Metas */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" />
                Metas Glic\u00eamicas
              </h3>
              <p className="text-xs text-gray-400">
                As metas podem ser ajustadas conforme orienta\u00e7\u00e3o do obstetra.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta m\u00e1xima em jejum <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={fastingTarget}
                      onChange={(e) => setFastingTarget(e.target.value)}
                      min="50"
                      max="300"
                      className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">mg/dL</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta m\u00e1xima p\u00f3s-refei\u00e7\u00f5es <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={postMealTarget}
                      onChange={(e) => setPostMealTarget(e.target.value)}
                      min="50"
                      max="300"
                      className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">mg/dL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {isEditing && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isEditing ? 'Atualizar cadastro' : 'Salvar cadastro'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
