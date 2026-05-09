'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Heart, ClipboardList, BarChart3, FileText, Shield, Clock, ArrowRight, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const features = [
  {
    icon: ClipboardList,
    title: 'Registre suas medições diárias',
    description: 'Anote glicemia em jejum e após as refeições de forma simples, pelo celular ou computador.',
  },
  {
    icon: BarChart3,
    title: 'Acompanhe seus resultados com clareza',
    description: 'Veja rapidamente quais valores estão dentro da meta e quais precisam de atenção.',
  },
  {
    icon: FileText,
    title: 'Gere relatórios para o obstetra',
    description: 'Baixe um PDF organizado com resumo, estatísticas e tabela completa das medições.',
  },
  {
    icon: Shield,
    title: 'Tenha seu histórico sempre salvo',
    description: 'Não dependa de papel, bloco de notas ou mensagens perdidas no WhatsApp.',
  },
  {
    icon: Clock,
    title: 'Adapte ao seu protocolo médico',
    description: 'Escolha se as medições após as refeições são feitas em 1 hora ou 2 horas, conforme orientação do obstetra.',
  },
];

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-pink-500">
          <Heart className="w-12 h-12 mx-auto" fill="currentColor" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2 rounded-xl shadow-md">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">GlicoGest</h1>
              <p className="text-xs text-gray-500">Controle Glicêmico Gestacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4" fill="currentColor" />
            Cuidado e acompanhamento para você e seu bebê
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Controle sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">glicemia gestacional</span> com simplicidade
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto mb-10">
            Registre, acompanhe e compartilhe suas medições com o obstetra. Tudo organizado, salvo e acessível de qualquer lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Comece grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#planos"
              className="px-8 py-4 border-2 border-pink-200 text-pink-600 font-semibold rounded-xl hover:bg-pink-50 transition-all text-lg"
            >
              Ver planos
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-3">Tudo o que você precisa</h3>
          <p className="text-gray-500">Simples, seguro e feito para a rotina da gestante</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 card-shadow card-hover transition-all duration-300"
            >
              <div className="bg-pink-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-pink-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-3">Planos</h3>
          <p className="text-gray-500">Escolha o plano ideal para acompanhar sua gestação</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 card-shadow border-2 border-gray-100"
          >
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-1">Grátis</h4>
              <p className="text-sm text-gray-500 mb-4">Para testar</p>
              <div className="text-4xl font-bold text-gray-800">
                R$ 0
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Cadastro da paciente',
                'Até 7 dias de registros',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 border-2 border-pink-200 text-pink-600 font-medium rounded-xl hover:bg-pink-50 transition-all"
            >
              Comece grátis
            </Link>
          </motion.div>

          {/* Paid Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 card-shadow border-2 border-pink-300 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" fill="white" /> Recomendado
              </span>
            </div>
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-1">Plano Único Gestacional</h4>
              <p className="text-sm text-gray-500 mb-4">Pagamento único · Até 6 meses de uso</p>
              <div className="text-4xl font-bold text-pink-600">
                R$ 39,90
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Cadastro da paciente',
                'Registros ilimitados de glicemia',
                'Escolha de protocolo 1h ou 2h',
                'Dashboard com estatísticas',
                'Relatório PDF ilimitado',
                'Histórico salvo durante toda a gestação',
                'Até 6 meses de uso',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
                  <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
            >
              Assinar agora
            </Link>
          </motion.div>
        </div>
      </section>

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
