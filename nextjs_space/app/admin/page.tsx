"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, Activity, Crown, RefreshCw, CheckCircle, Clock, XCircle, Trash2, MailCheck } from "lucide-react";

const ADMIN_EMAIL = "ceselgueta@gmail.com";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  free_trial: "Teste Grátis",
  monthly: "Mensal",
  quarterly: "3 Meses",
  gestation_full: "Gestação Completa",
  premium: "Premium",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  free_trial: "bg-blue-100 text-blue-700",
  monthly: "bg-emerald-100 text-emerald-700",
  quarterly: "bg-purple-100 text-purple-700",
  gestation_full: "bg-pink-100 text-pink-700",
  premium: "bg-amber-100 text-amber-700",
};

type User = {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  planExpiresAt: string | null;
  planStartedAt: string | null;
  hasUsedTrial: boolean;
  paymentStatus: string;
  emailVerified: string | null;
  createdAt: string;
  _count: { readings: number };
};

type Stats = {
  totalUsers: number;
  recentSignups: number;
  totalReadings: number;
  planCounts: Record<string, number>;
  users: User[];
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function daysRemaining(expiresAt: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session.user?.email !== ADMIN_EMAIL) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session.user?.email === ADMIN_EMAIL) {
      fetchStats();
    }
  }, [status, session]);

  async function activatePlan(email: string, planId: string) {
    setActivating(email);
    try {
      const res = await fetch("/api/plans/admin-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: email, planId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStats();
      } else {
        alert(data.error || "Erro ao ativar plano");
      }
    } finally {
      setActivating(null);
    }
  }

  async function deleteUser(email: string) {
    if (!confirm(`Excluir usuário ${email}? Esta ação não pode ser desfeita.`)) return;
    setDeleting(email);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success || data.error === undefined) {
        await fetchStats();
      } else {
        alert(data.error || "Erro ao excluir usuário");
      }
    } finally {
      setDeleting(null);
    }
  }

  async function testEmail() {
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/admin/test-email", { method: "POST" });
      setTestEmailResult(await res.json());
    } catch (e: any) {
      setTestEmailResult({ exception: e?.message });
    } finally {
      setTestingEmail(false);
    }
  }

  async function verifyEmail(email: string) {
    setVerifying(email);
    try {
      const res = await fetch("/api/admin/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStats();
      } else {
        alert(data.error || "Erro ao verificar email");
      }
    } finally {
      setVerifying(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const filteredUsers = stats.users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const paidCount = stats.users.filter((u) =>
    ["monthly", "quarterly", "gestation_full", "premium"].includes(u.plan) && !isExpired(u.planExpiresAt)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="text-pink-500" size={22} />
          <h1 className="text-lg font-semibold text-gray-800">Admin — GlicoGest</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={testEmail}
            disabled={testingEmail}
            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            <MailCheck size={15} />
            {testingEmail ? "Testando..." : "Testar Email"}
          </button>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Resultado do teste de email */}
        {testEmailResult && (
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Diagnóstico Resend</h2>
              <button onClick={() => setTestEmailResult(null)} className="text-gray-400 hover:text-gray-600 text-xs">Fechar</button>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64 text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(testEmailResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users size={20} className="text-blue-500" />}
            label="Total de usuários"
            value={stats.totalUsers}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-emerald-500" />}
            label="Últimos 30 dias"
            value={stats.recentSignups}
            bg="bg-emerald-50"
          />
          <StatCard
            icon={<Crown size={20} className="text-pink-500" />}
            label="Planos pagos ativos"
            value={paidCount}
            bg="bg-pink-50"
          />
          <StatCard
            icon={<Activity size={20} className="text-purple-500" />}
            label="Total de registros"
            value={stats.totalReadings}
            bg="bg-purple-50"
          />
        </div>

        {/* Breakdown por plano */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Usuários por plano</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.planCounts).map(([plan, count]) => (
              <div key={plan} className={`px-3 py-2 rounded-lg text-sm font-medium ${PLAN_COLORS[plan] || "bg-gray-100 text-gray-700"}`}>
                {PLAN_LABELS[plan] || plan}: <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela de usuários */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-5 border-b flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Usuários ({filteredUsers.length})
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="all">Todos os planos</option>
                <option value="free">Gratuito</option>
                <option value="free_trial">Teste Grátis</option>
                <option value="monthly">Mensal</option>
                <option value="quarterly">3 Meses</option>
                <option value="gestation_full">Gestação Completa</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="px-4 py-3 text-left">Plano</th>
                  <th className="px-4 py-3 text-left">Expira</th>
                  <th className="px-4 py-3 text-center">Registros</th>
                  <th className="px-4 py-3 text-left">Cadastro</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const expired = isExpired(user.planExpiresAt);
                  const days = daysRemaining(user.planExpiresAt);
                  const isPaid = ["monthly", "quarterly", "gestation_full", "premium"].includes(user.plan);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{user.name || "—"}</div>
                        <div className="text-gray-400 text-xs">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[user.plan] || "bg-gray-100 text-gray-700"}`}>
                          {PLAN_LABELS[user.plan] || user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {user.planExpiresAt ? (
                          <span className={expired ? "text-red-500" : days !== null && days <= 7 ? "text-amber-500" : ""}>
                            {formatDate(user.planExpiresAt)}
                            {!expired && days !== null && <span className="text-xs ml-1">({days}d)</span>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{user._count.readings}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        {user.emailVerified ? (
                          <span className="flex items-center gap-1 text-emerald-500 text-xs"><CheckCircle size={13} /> Verificado</span>
                        ) : (
                          <button
                            onClick={() => verifyEmail(user.email)}
                            disabled={verifying === user.email}
                            title="Verificar email manualmente"
                            className="flex items-center gap-1 text-amber-500 text-xs hover:text-amber-700 disabled:opacity-50"
                          >
                            <MailCheck size={13} />
                            {verifying === user.email ? "..." : "Pendente"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.plan === "free" ? (
                          <span className="flex items-center gap-1 text-gray-400 text-xs"><XCircle size={13} /> Sem plano</span>
                        ) : expired ? (
                          <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={13} /> Expirado</span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-500 text-xs">
                            {isPaid ? <CheckCircle size={13} /> : <Clock size={13} />}
                            {isPaid ? "Pago" : "Trial"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={activating === user.email}
                            onChange={(e) => {
                              if (e.target.value) activatePlan(user.email, e.target.value);
                              e.target.value = "";
                            }}
                            defaultValue=""
                            className="border rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-50"
                          >
                            <option value="" disabled>Ativar plano...</option>
                            <option value="monthly">Mensal (30d)</option>
                            <option value="quarterly">3 Meses (90d)</option>
                            <option value="gestation_full">Gestação (270d)</option>
                          </select>
                          <button
                            onClick={() => deleteUser(user.email)}
                            disabled={deleting === user.email}
                            title="Excluir usuário"
                            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">Nenhum usuário encontrado</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value.toLocaleString("pt-BR")}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
