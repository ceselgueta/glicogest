'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import PeriodFilter from '@/components/period-filter';
import StatsCards from '@/components/stats-cards';
import ReadingForm from '@/components/reading-form';
import ReadingsTable from '@/components/readings-table';
import PdfButton from '@/components/pdf-button';
import { getDateRange, formatDateISO } from '@/lib/utils';
import type { GlucoseReading, Stats } from '@/lib/types';
import { motion } from 'framer-motion';

export default function Home() {
  const [filter, setFilter] = useState('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const getEffectiveDates = useCallback(() => {
    const range = getDateRange(filter, customStart, customEnd);
    return {
      startDate: formatDateISO(range?.start ?? new Date()),
      endDate: formatDateISO(range?.end ?? new Date()),
    };
  }, [filter, customStart, customEnd]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getEffectiveDates();
    
    try {
      const [readingsRes, statsRes] = await Promise.all([
        fetch(`/api/readings?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/stats?startDate=${startDate}&endDate=${endDate}`),
      ]);

      const readingsData = await readingsRes.json().catch(() => ({ data: [] }));
      const statsData = await statsRes.json().catch(() => ({ data: null }));

      setReadings(readingsData?.data ?? []);
      setStats(statsData?.data ?? null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [getEffectiveDates]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (newFilter === 'custom') {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      setCustomStart(formatDateISO(weekAgo));
      setCustomEnd(formatDateISO(today));
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
  };

  const { startDate, endDate } = getEffectiveDates();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Acompanhamento de <span className="text-pink-500">Glicemia</span>
          </h2>
          <p className="text-gray-500">
            Registre e acompanhe as medidas glicêmicas diárias de forma simples e organizada
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <PeriodFilter
              currentFilter={filter}
              customStart={customStart}
              customEnd={customEnd}
              onFilterChange={handleFilterChange}
              onCustomDateChange={handleCustomDateChange}
            />
          </div>
          <PdfButton startDate={startDate} endDate={endDate} disabled={loading} />
        </div>

        <StatsCards stats={stats} loading={loading} />
        
        <ReadingForm existingReadings={readings} onSave={fetchData} />
        
        <ReadingsTable readings={readings} loading={loading} onDelete={fetchData} />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
        <p>Controle Glicêmico Gestacional · Monitoramento diário para saúde</p>
      </footer>
    </div>
  );
}
