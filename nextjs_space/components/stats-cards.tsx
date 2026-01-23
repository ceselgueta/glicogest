'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { GLUCOSE_THRESHOLD, READING_TYPE_LABELS } from '@/lib/constants';
import type { Stats } from '@/lib/types';

interface StatsCardsProps {
  stats: Stats | null;
  loading: boolean;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span className="animate-count">{displayValue}{suffix}</span>;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 card-shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalReadings = stats?.totalReadings ?? 0;
  const aboveThreshold = stats?.aboveThreshold ?? 0;
  const percentAbove = stats?.percentAbove ?? 0;

  const cards = [
    {
      icon: Activity,
      label: 'Total de Leituras',
      value: totalReadings,
      suffix: '',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: AlertTriangle,
      label: `Acima de ${GLUCOSE_THRESHOLD} mg/dL`,
      value: aboveThreshold,
      suffix: '',
      color: aboveThreshold > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: aboveThreshold > 0 ? 'bg-red-50' : 'bg-green-50',
    },
    {
      icon: TrendingUp,
      label: 'Percentual Elevado',
      value: percentAbove,
      suffix: '%',
      color: percentAbove > 30 ? 'text-red-500' : percentAbove > 15 ? 'text-amber-500' : 'text-green-500',
      bgColor: percentAbove > 30 ? 'bg-red-50' : percentAbove > 15 ? 'bg-amber-50' : 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 card-shadow card-hover transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-sm text-gray-500 font-medium">{card.label}</span>
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>
              <AnimatedNumber value={card.value} suffix={card.suffix} />
            </div>
          </motion.div>
        ))}
      </div>

      {stats?.byType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 card-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-pink-500" />
            Estatísticas por Tipo de Medida
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byType).map(([type, data]) => {
              const percent = data?.percent ?? 0;
              const color = percent > 30 ? 'text-red-500' : percent > 15 ? 'text-amber-500' : 'text-green-500';
              const bgColor = percent > 30 ? 'bg-red-100' : percent > 15 ? 'bg-amber-100' : 'bg-green-100';
              
              return (
                <div key={type} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    {READING_TYPE_LABELS[type] ?? type}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400">{data?.total ?? 0} medidas</p>
                      <p className="text-xs text-gray-400">{data?.above ?? 0} elevadas</p>
                    </div>
                    <div className={`${bgColor} px-3 py-1 rounded-full`}>
                      <span className={`text-lg font-bold ${color}`}>{percent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
