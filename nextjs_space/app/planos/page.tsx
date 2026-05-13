"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PLANS, formatPrice, computePlanStatus } from "@/lib/plans";
import type { PlanDefinition } from "@/lib/plans";
import { Heart, Check, Star, ArrowRight, Loader2, Clock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function PlanosPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [planStatus, setPlanStatus] = useState<ReturnType<typeof computePlanStatus> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPlanStatus();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchPlanStatus = async () => {
    try {
      const res = await fetch("/api/plans/status");
      const data = await res.json();
      if (data?.success) {
        setPlanStatus(data.data);
      }
    } catch (e) {
      console.error("Error fetching plan status:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTrial = async () => {
    if (!session) {
      router.push("/signup");
      return;
    }
    setActivatingTrial(true);
    try {
      const res = await fetch("/api/plans/activate-trial", { method: "POST" });
      const data = await res.json();
      if (data?.success) {
        toast.success("Teste grátis ativado! Aproveite 4 dias completos.");
        await update();
        router.push("/dashboard");
      } else {
        toast.error(data?.error || "Erro ao ativar teste grátis");
      }
    } catch {
      toast.error("Erro ao ativar teste grátis");
    } finally {
      setActivatingTrial(false);
    }
  };

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (!session) {
      router.push("/signup");
      return;
    }
    setProcessingPlan(planId);
    try {
      const res = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data?.initPoint) {
        // Redirect to Mercado Pago checkout
        window.location.href = data.initPoint;
      } else {
        toast.error(data?.error || "Erro ao iniciar pagamento");
      }
    } catch {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    );
  }

  const isLoggedIn = status === "authenticated";
  const canUseTrial = isLoggedIn && planStatus && !planStatus.hasUsedTrial && planStatus.plan === "free";
  const hasActivePlan = planStatus?.isActive;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2 rounded-xl shadow-md">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">GlicoGest</h1>
              <p className="text-xs text-gray-500">Controle Glicêmico Gestacional</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Active plan banner */}
        {hasActivePlan && planStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{planStatus.statusLabel}</span>
            </div>
            <p className="text-pink-100 text-sm">
              Seu acesso está ativo. Você pode renovar ou trocar de plano a qualquer momento.
            </p>
          </motion.div>
        )}

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">Escolha seu plano</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Registre suas medições, acompanhe seus resultados e gere relatórios para o obstetra.
          </p>
          <p className="text-pink-600 font-medium mt-3 text-sm">
            Sem assinatura obrigatória. Pagamento único pelo período escolhido.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              isLoggedIn={isLoggedIn}
              canUseTrial={canUseTrial ?? false}
              activatingTrial={activatingTrial}
              processingPlan={processingPlan}
              currentPlan={planStatus?.plan}
              onActivateTrial={handleActivateTrial}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>

        {/* FAQ / Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-gray-400 text-sm">
            Após expirar, seus dados permanecem salvos. Você pode visualizar o dashboard, mas não pode registrar novas medições nem gerar PDF até escolher um novo plano.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-pink-100 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
            <span className="font-medium text-gray-500">GlicoGest</span>
          </div>
          <p>Controle Glicêmico Gestacional · Cuidando de você e do seu bebê</p>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({
  plan,
  index,
  isLoggedIn,
  canUseTrial,
  activatingTrial,
  processingPlan,
  currentPlan,
  onActivateTrial,
  onSelectPlan,
}: {
  plan: PlanDefinition;
  index: number;
  isLoggedIn: boolean;
  canUseTrial: boolean;
  activatingTrial: boolean;
  processingPlan: string | null;
  currentPlan?: string;
  onActivateTrial: () => void;
  onSelectPlan: (id: string) => void;
}) {
  const isTrial = plan.id === "free_trial";
  const isCurrentPlan = currentPlan === plan.id;
  const isHighlighted = plan.highlight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`relative bg-white rounded-2xl p-6 card-shadow transition-all duration-300 flex flex-col ${
        isHighlighted
          ? "border-2 border-pink-400 ring-2 ring-pink-100"
          : "border-2 border-gray-100 hover:border-pink-200"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow-md">
            <Star className="w-3 h-3" fill="white" />
            {plan.badge}
          </span>
        </div>
      )}

      <div className="text-center mb-5 pt-2">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{plan.name}</h3>
        <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
        <div className="text-3xl font-bold text-gray-800">
          {plan.price === 0 ? (
            <span className="text-green-600">Grátis</span>
          ) : (
            <span className={isHighlighted ? "text-pink-600" : ""}>
              {formatPrice(plan.price)}
            </span>
          )}
        </div>
        {plan.price > 0 && (
          <p className="text-xs text-gray-400 mt-1">{plan.durationDays} dias de acesso</p>
        )}
        {isTrial && <p className="text-xs text-gray-400 mt-1">4 dias · 1 PDF</p>}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-gray-600 text-sm">
            <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isHighlighted ? "text-pink-500" : "text-green-500"}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <button
          disabled
          className="w-full px-4 py-3 bg-gray-100 text-gray-500 font-medium rounded-xl cursor-not-allowed text-sm"
        >
          Plano atual
        </button>
      ) : isTrial ? (
        <button
          onClick={onActivateTrial}
          disabled={activatingTrial || (isLoggedIn && !canUseTrial)}
          className={`w-full px-4 py-3 font-medium rounded-xl transition-all text-sm ${
            isLoggedIn && !canUseTrial
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          }`}
        >
          {activatingTrial ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Ativando...
            </span>
          ) : isLoggedIn && !canUseTrial ? (
            "Teste já utilizado"
          ) : (
            plan.buttonText
          )}
        </button>
      ) : (
        <button
          onClick={() => onSelectPlan(plan.id)}
          disabled={processingPlan !== null}
          className={`w-full px-4 py-3 font-medium rounded-xl transition-all text-sm ${
            processingPlan !== null
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isHighlighted
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-md"
              : "bg-pink-50 text-pink-600 hover:bg-pink-100"
          }`}
        >
          {processingPlan === plan.id ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecionando...
            </span>
          ) : (
            plan.buttonText
          )}
        </button>
      )}
    </motion.div>
  );
}
