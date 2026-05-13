"use client";

import { useRouter } from "next/navigation";
import type { PlanStatus } from "@/lib/plans";
import { getPlanById } from "@/lib/plans";
import { Clock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface PlanBannerProps {
  planStatus: PlanStatus | null;
}

export default function PlanBanner({ planStatus }: PlanBannerProps) {
  const router = useRouter();

  if (!planStatus) return null;

  const { plan, isActive, daysRemaining, statusLabel, canRegisterReadings } = planStatus;

  // No plan at all - show CTA to choose plan
  if (plan === "free" && !planStatus.hasUsedTrial) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden sm:block text-2xl">🎁</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Comece com 4 dias grátis!</p>
              <p className="text-gray-500 text-xs">Teste todas as funcionalidades sem compromisso.</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/planos")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md text-sm whitespace-nowrap"
          >
            Ver planos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Active plan
  if (isActive) {
    const isTrialLow = plan === "free_trial" && daysRemaining <= 1;
    const isPaidLow = plan !== "free_trial" && daysRemaining <= 7;

    if (isTrialLow || isPaidLow) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <AlertTriangle className="w-5 h-5 text-amber-500 hidden sm:block" />
              <div>
                <p className="font-semibold text-gray-800 text-sm">{statusLabel}</p>
                <p className="text-gray-500 text-xs">
                  {plan === "free_trial"
                    ? "Seu teste grátis está acabando. Escolha um plano para continuar."
                    : "Seu acesso está acabando. Renove para não perder o acesso."}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/planos")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md text-sm whitespace-nowrap"
            >
              Ver planos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      );
    }

    // Active and healthy
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold text-gray-800 text-sm">{statusLabel}</p>
              {plan === "free_trial" && planStatus.pdfLimit !== null && (
                <p className="text-gray-500 text-xs">
                  PDF: {planStatus.pdfReportsGenerated}/{planStatus.pdfLimit} utilizado
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{daysRemaining} dias</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Expired or no plan (used trial)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <AlertTriangle className="w-5 h-5 text-red-500 hidden sm:block" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">{statusLabel}</p>
            <p className="text-gray-500 text-xs">
              {plan === "free_trial" || planStatus.hasUsedTrial
                ? "Seu teste grátis terminou. Escolha um plano para continuar usando o sistema."
                : "Seu período de acesso terminou. Renove seu acesso para continuar registrando medições e gerando relatórios."}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/planos")}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md text-sm whitespace-nowrap"
        >
          Ver planos
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
