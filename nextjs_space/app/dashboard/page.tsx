"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import PeriodFilter from "@/components/period-filter";
import StatsCards from "@/components/stats-cards";
import ReadingForm from "@/components/reading-form";
import ReadingsTable from "@/components/readings-table";
import PdfButton from "@/components/pdf-button";
import PatientRegistration from "@/components/patient-registration";
import PatientSummary from "@/components/patient-summary";
import PlanBanner from "@/components/plan-banner";
import { getDateRange, formatDateISO } from "@/lib/utils";
import type { GlucoseReading, Stats, PatientSettings } from "@/lib/types";
import { computePlanStatus } from "@/lib/plans";
import type { PlanStatus } from "@/lib/plans";
import { motion } from "framer-motion";
import { Loader2, Heart, CheckCircle2, Circle, X } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState("7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientSettings, setPatientSettings] = useState<PatientSettings | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Dispara CompleteRegistration para novos usuários via Google SSO (?welcome=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.search.includes('welcome=1')) return;
    if ((window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration');
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('welcome');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Fetch patient settings
  const fetchPatientSettings = useCallback(async () => {
    setPatientLoading(true);
    try {
      const res = await fetch("/api/patient");
      const data = await res.json();
      if (data?.success) {
        setPatientSettings(data.data ?? null);
        if (!data.data) {
          setShowRegistration(true);
        }
      }
    } catch (error) {
      console.error("Error fetching patient settings:", error);
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const [planLoaded, setPlanLoaded] = useState(false);

  // Fetch plan status from API - updated to track loaded state
  const fetchPlanStatusAndCheck = useCallback(async () => {
    try {
      const res = await fetch("/api/plans/status");
      const data = await res.json();
      if (data?.success) {
        setPlanStatus(data.data);
      }
    } catch (error) {
      console.error("Error fetching plan status:", error);
    } finally {
      setPlanLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPatientSettings();
      fetchPlanStatusAndCheck();
    }
  }, [fetchPatientSettings, fetchPlanStatusAndCheck, status]);

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
    // Meta pós-refeição sempre baseada no protocolo: 1h = 140, 2h = 120 (SBD/FEBRASGO 2025)
    const protocol = patientSettings?.postMealProtocol ?? '2h';
    const pmt = protocol === '1h' ? 140 : 120;

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
      console.error("Error fetching data:", error);
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
    if (newFilter === "custom") {
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

  const handlePatientSave = async (settings: PatientSettings) => {
    setPatientSettings(settings);
    setShowRegistration(false);
    setEditingPatient(false);

    // After first patient registration, check if user needs a plan
    if (!editingPatient) {
      try {
        const res = await fetch("/api/plans/status");
        const data = await res.json();
        if (data?.success) {
          const ps = data.data;
          setPlanStatus(ps);
          // If user has no active plan, redirect to plans page
          if (!ps.isActive) {
            router.push("/planos");
            return;
          }
        }
      } catch (e) {
        console.error("Error checking plan after patient save:", e);
      }
    }
  };

  const handleEditPatient = () => {
    setEditingPatient(true);
    setShowRegistration(true);
  };

  // Auto-redirect to plans page if user has no active plan and has completed patient registration
  useEffect(() => {
    if (planLoaded && !patientLoading && planStatus && patientSettings && !planStatus.isActive && !showRegistration) {
      router.push("/planos");
    }
  }, [planLoaded, patientLoading, planStatus, patientSettings, showRegistration, router]);

  // Loading / auth check
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-pink-500">
          <Heart className="w-12 h-12 mx-auto" fill="currentColor" />
        </div>
      </div>
    );
  }

  const { startDate, endDate } = getEffectiveDates();

  // Loading patient data
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

  const protocol = patientSettings?.postMealProtocol ?? "2h";
  const canRegister = planStatus?.canRegisterReadings ?? false;
  const canPdf = planStatus?.canGeneratePdf ?? false;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Acompanhamento de <span className="text-pink-500">Glicemia</span>
          </h2>
          <p className="text-gray-500">
            Registre e acompanhe as medidas glicêmicas diárias de forma simples e organizada
          </p>
        </motion.div>

        {/* Plan Status Banner */}
        <PlanBanner planStatus={planStatus} />

        {/* Onboarding welcome card — shown only for new users with no readings */}
        {patientSettings && planStatus?.isActive && readings.length === 0 && !welcomeDismissed && (
          <WelcomeCard onDismiss={() => setWelcomeDismissed(true)} />
        )}

        {patientSettings && <PatientSummary settings={patientSettings} onEdit={handleEditPatient} />}

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
          <PdfButton
            startDate={startDate}
            endDate={endDate}
            disabled={loading}
            canPdf={canPdf}
            pdfLimit={planStatus?.pdfLimit ?? null}
            pdfGenerated={planStatus?.pdfReportsGenerated ?? 0}
            planActive={planStatus?.isActive ?? false}
          />
        </div>

        <StatsCards stats={stats} loading={loading} patientSettings={patientSettings} protocol={protocol} />

        {canRegister ? (
          <ReadingForm existingReadings={readings} onSave={fetchData} patientSettings={patientSettings} />
        ) : (
          <ExpiredAccessCard />
        )}

        <ReadingsTable
          readings={readings}
          loading={loading}
          onDelete={canRegister ? fetchData : undefined}
          patientSettings={patientSettings}
          protocol={protocol}
        />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
          <span className="font-medium text-gray-500">GlicoGest</span>
        </div>
        <p>Controle Glicêmico Gestacional · Cuidando de você e do seu bebê</p>
      </footer>
    </div>
  );
}

function WelcomeCard({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    { label: "Conta criada", done: true },
    { label: "Dados cadastrados", done: true },
    { label: "Registre sua primeira medição", done: false },
    { label: "Gere seu primeiro relatório PDF", done: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-2xl p-6 relative"
    >
      <button
        onClick={onDismiss}
        aria-label="Fechar"
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
        <h3 className="text-lg font-bold text-gray-800">Bem-vinda ao GlicoGest! 🎉</h3>
      </div>
      <p className="text-gray-500 text-sm mb-5">Siga os passos abaixo para começar:</p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={`text-sm ${step.done ? "text-gray-400 line-through" : "text-gray-700 font-medium"}`}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-gray-400 mt-5">
        Este guia desaparece automaticamente após seu primeiro registro.
      </p>
    </motion.div>
  );
}

function ExpiredAccessCard() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 text-center border-2 border-pink-200"
    >
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Seu acesso terminou</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Para continuar registrando suas medições e gerando relatórios, escolha um dos planos abaixo.
      </p>
      <button
        onClick={() => router.push("/planos")}
        className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
      >
        Ver planos
      </button>
    </motion.div>
  );
}
