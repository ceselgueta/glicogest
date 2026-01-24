'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PeriodFilterProps {
  currentFilter: string;
  customStart: string;
  customEnd: string;
  onFilterChange: (filter: string) => void;
  onCustomDateChange: (start: string, end: string) => void;
}

const FILTER_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '14days', label: 'Últimos 14 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

export default function PeriodFilter({
  currentFilter,
  customStart,
  customEnd,
  onFilterChange,
  onCustomDateChange,
}: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = FILTER_OPTIONS.find(o => o.value === currentFilter)?.label ?? 'Selecione';

  return (
    <div className="bg-white rounded-2xl p-4 card-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-500" />
          <span className="font-medium text-gray-700">Período:</span>
        </div>
        
        <div className="relative flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-gray-700"
          >
            <span>{currentLabel}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-full sm:w-48 bg-white rounded-xl shadow-lg border border-pink-100 z-10 overflow-hidden"
              >
                {FILTER_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onFilterChange(option.value);
                      if (option.value !== 'custom') setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-pink-50 transition-colors ${
                      currentFilter === option.value ? 'bg-pink-100 text-pink-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {currentFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <input
              type="date"
              value={customStart}
              onChange={(e) => onCustomDateChange(e.target.value, customEnd)}
              min="2026-01-16"
              max="2026-03-20"
              className="px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomDateChange(customStart, e.target.value)}
              min="2026-01-16"
              max="2026-03-20"
              className="px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
