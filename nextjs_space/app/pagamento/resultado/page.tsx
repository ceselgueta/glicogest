'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, CheckCircle, XCircle, Clock, Loader2, ArrowRight, FileText, BarChart2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

function ResultadoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [verifying, setVerifying] = useState(true);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);

  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, externalReference }),
        });
        const data = await res.json();
        setFinalStatus(data.status || status || 'unknown');
        if (data.status === 'approved') {
          await update();
        }
      } catch {
        setFinalStatus(status || 'unknown');
      } finally {
        setVerifying(false);
      }
    };

    const timer = setTimeout(verifyPayment, 2000);
    return () => clearTimeout(timer);
  }, []);

  const isApproved = finalStatus === 'approved' || status === 'success';
  const isPending = finalStatus === 'pending' || status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {verifying ? (
            <div className="p-10 text-center">
              <Loader2 className="w-14 h-14 text-pink-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmando seu pagamento...</h2>
              <p className="text-gray-400 text-sm">Isso leva apenas alguns segundos.</p>
            </div>
          ) : isApproved ? (
            <>
              {/* Header verde */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
                <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Pagamento confirmado! 🎉</h2>
                <p className="text-green-100 text-sm">Seu plano está ativo agora</p>
              </div>

              {/* Próximos passos */}
              <div className="p-8">
                <p className="text-gray-600 text-sm mb-6 text-center">
                  Obrigada por assinar o GlicoGest! Veja o que você pode fazer agora:
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-xl">
                    <div className="bg-pink-100 rounded-lg p-2 flex-shrink-0">
                      <BarChart2 className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Registre suas medições</p>
                      <p className="text-gray-500 text-xs mt-0.5">Jejum, pós-café, pós-almoço e pós-janta — tudo em segundos</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-xl">
                    <div className="bg-pink-100 rounded-lg p-2 flex-shrink-0">
                      <FileText className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Gere o relatório PDF</p>
                      <p className="text-gray-500 text-xs mt-0.5">Envie para sua obstetra com um clique</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-xl">
                    <div className="bg-pink-100 rounded-lg p-2 flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Precisa de ajuda?</p>
                      <p className="text-gray-500 text-xs mt-0.5">Fale conosco: glicogestcontrole@gmail.com</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Começar a usar o GlicoGest
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : isPending ? (
            <>
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-8 text-center text-white">
                <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Pagamento em processamento</h2>
                <p className="text-amber-100 text-sm">Aguardando confirmação</p>
              </div>

              <div className="p-8 text-center">
                <p className="text-gray-600 text-sm mb-6">
                  Seu pagamento está sendo processado. Assim que for confirmado, seu plano será ativado automaticamente e você receberá acesso completo.
                </p>
                <p className="text-gray-400 text-xs mb-6">
                  Pagamentos via PIX são confirmados em segundos. Cartão de crédito pode levar alguns minutos.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Ir para o Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-r from-red-400 to-rose-500 p-8 text-center text-white">
                <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Pagamento não aprovado</h2>
                <p className="text-red-100 text-sm">Não foi possível processar o pagamento</p>
              </div>

              <div className="p-8 text-center">
                <p className="text-gray-600 text-sm mb-6">
                  Houve um problema com seu pagamento. Isso pode acontecer por saldo insuficiente, dados incorretos ou limite do cartão. Tente novamente com outro método.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/planos')}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
                  >
                    Tentar novamente
                  </button>
                  <Link
                    href="/dashboard"
                    className="block w-full px-6 py-3 border-2 border-pink-200 text-pink-600 font-medium rounded-xl hover:bg-pink-50 transition-all text-center"
                  >
                    Voltar ao Dashboard
                  </Link>
                  <p className="text-xs text-gray-400 mt-2">
                    Problemas? Fale conosco: glicogestcontrole@gmail.com
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="px-8 pb-6 flex items-center justify-center gap-2 text-gray-300">
            <Heart className="w-3.5 h-3.5 text-pink-300" fill="currentColor" />
            <span className="text-xs">GlicoGest — Cuidando da sua gestação</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    }>
      <ResultadoContent />
    </Suspense>
  );
}
