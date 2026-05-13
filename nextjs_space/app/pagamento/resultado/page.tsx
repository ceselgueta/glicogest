'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, CheckCircle, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
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

    // Small delay to let webhook process first
    const timer = setTimeout(verifyPayment, 2000);
    return () => clearTimeout(timer);
  }, []);

  const isApproved = finalStatus === 'approved' || status === 'success';
  const isPending = finalStatus === 'pending' || status === 'pending';
  const isRejected = finalStatus === 'rejected' || status === 'failure';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verificando pagamento...</h2>
            <p className="text-gray-500">Aguarde um momento enquanto confirmamos seu pagamento.</p>
          </>
        ) : isApproved ? (
          <>
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento confirmado! 🎉</h2>
            <p className="text-gray-500 mb-6">
              Seu plano foi ativado com sucesso. Agora você pode registrar suas medições e gerar relatórios.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Ir para o Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : isPending ? (
          <>
            <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento pendente</h2>
            <p className="text-gray-500 mb-6">
              Seu pagamento está sendo processado. Assim que for confirmado, seu plano será ativado automaticamente.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Ir para o Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento não aprovado</h2>
            <p className="text-gray-500 mb-6">
              Houve um problema com seu pagamento. Tente novamente ou escolha outro método de pagamento.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/planos')}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
              >
                Tentar novamente
              </button>
              <Link
                href="/dashboard"
                className="block w-full px-6 py-3 border-2 border-pink-200 text-pink-600 font-medium rounded-xl hover:bg-pink-50 transition-all"
              >
                Voltar ao Dashboard
              </Link>
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400">
          <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
          <span className="text-sm">GlicoGest</span>
        </div>
      </motion.div>
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
