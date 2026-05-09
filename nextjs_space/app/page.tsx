'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import PeriodFilter from '@/components/period-filter';
import StatsCards from '@/components/stats-cards';
import ReadingForm from '@/components/reading-form';
import ReadingsTable from '@/components/readings-table';
import PdfButton from '@/components/pdf-button';
import PatientRegistration from '@/components/patient-registration';
import PatientSummary from '@/components/patient-summary';
import { getDateRange, formatDateISO } from '@/lib/utils';
import type { GlucoseReading, Stats, PatientSettings } from '@/lib/types';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [filter, setFilter] = useState('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientSettings, setPatientSettings] = useState<PatientSettings | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);

  // Fetch patient settings
  const fetchPatientSettings = useCallback(async () => {
    setPatientLoading(true);
    try {
      const res = await fetch('/api/patient');
      const data = await res.json();
      if (data?.success) {
        setPatientSettings(data.data ?? null);
        if (!data.data) {
          setShowRegistration(true);
        }
      }
    } catch (error) {
      console.error('Error fetching patient settings:', error);
    } finally {
      setPatientLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatientSettings();
  }, [fetchPatientSettings]);

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
    const ft = patientSettings?.fastingTarget ?? 95;
    const pmt = patientSettings?.postMealTarget ?? 120;
    
    try {
      const [readingsRes, statsRes] = await Promise.all([
        fetch(`/api/readings?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/stats?startDate=${startDate}&endDate=${endDate}&fastingTarget=${ft}&postMealTarget=${pmt}`),
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
  }, [getEffectiveDates, patientSettings]);

  useEffect(() => {
    if (patientSettings) {
      fetchData();
    }
  }, [fetchData, patientSettings]);

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

  const handlePatientSave = (settings: PatientSettings) => {
    setPatientSettings(settings);
    setShowRegistration(false);
    setEditingPatient(false);
  };

  const handleEditPatient = () => {
    setEditingPatient(true);
    setShowRegistration(true);
  };

  const { startDate, endDate } = getEffectiveDates();

  // Loading state
  if (patientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show registration form if no patient or editing
  if (showRegistration) {
    return (
      <div className="min-h-screen">
        <Header />
        <PatientRegistration
          existingSettings={editingPatient ? patientSettings : null}
          onSave={handlePatientSave}
          onCancel={editingPatient ? () => { setShowRegistration(false); setEditingPatient(false); } : undefined}
          isEditing={editingPatient}
        />
      </div>
    );
  }

  const protocol = patientSettings?.postMealProtocol ?? '2h';

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

        {patientSettings && (
          <PatientSummary settings={patientSettings} onEdit={handleEditPatient} />
        )}

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

        <StatsCards stats={stats} loading={loading} patientSettings={patientSettings} protocol={protocol} />
        
        <ReadingForm existingReadings={readings} onSave={fetchData} patientSettings={patientSettings} />
        
        <ReadingsTable readings={readings} loading={loading} onDelete={fetchData} patientSettings={patientSettings} protocol={protocol} />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
        <p>Controle Glicêmico Gestacional · Monitoramento diário para saúde</p>
      </footer>
    </div>
  );
}
