'use client';

import { User, Calendar, Stethoscope, Target, Clock, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PatientSettings } from '@/lib/types';

interface PatientSummaryProps {
  settings: PatientSettings;
  onEdit: () => void;
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function PatientSummary({ settings, onEdit }: PatientSummaryProps) {
  const protocolLabel = settings.postMealProtocol === '1h' ? '1 hora' : '2 horas';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-pink-500" />
          Dados da Paciente
        </h3>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          Editar cadastro
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-pink-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Paciente</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{settings.patientName}</p>
        </div>

        {settings.pregnancyWeeks && (
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Semana
            </p>
            <p className="text-sm font-semibold text-gray-800">{settings.pregnancyWeeks}\u00aa sem.</p>
          </div>
        )}

        {settings.doctorName && (
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Stethoscope className="w-3 h-3" /> Obstetra
            </p>
            <p className="text-sm font-semibold text-gray-800 truncate">{settings.doctorName}</p>
          </div>
        )}

        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Protocolo
          </p>
          <p className="text-sm font-semibold text-gray-800">{protocolLabel} ap\u00f3s</p>
        </div>

        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Meta jejum
          </p>
          <p className="text-sm font-semibold text-gray-800">{settings.fastingTarget} mg/dL</p>
        </div>

        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Meta p\u00f3s-ref.
          </p>
          <p className="text-sm font-semibold text-gray-800">{settings.postMealTarget} mg/dL</p>
        </div>
      </div>
    </motion.div>
  );
}
