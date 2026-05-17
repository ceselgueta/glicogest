"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Heart, ClipboardList, BarChart3, FileText, Shield, Clock, ArrowRight, Check, Star, AlertCircle, Smartphone, Quote } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/plans";

const dores = [
  "Anota no papel e perde as folhas antes da consulta",
  "Manda foto pelo WhatsApp e o médico não consegue ler",
  "Usa uma planilha confusa que não dá para mostrar no celular",
  "Fica com medo de esquecer de registrar uma medição importante",
  "Chega na consulta sem conseguir apresentar os dados de forma clara",
];

const features = [
  {
    icon: ClipboardList,
    title: "Registre em 5 segundos",
    description: "Jejum, pós-café, pós-almoço e pós-janta. Tudo pelo celular, sem complicação.",
  },
  {
    icon: BarChart3,
    title: "Veja o que está fora da meta",
    description: "Valores acima da meta ficam destacados automaticamente para facilitar o acompanhamento.",
  },
  {
    icon: FileText,
    title: "PDF para o obstetra em 1 clique",
    description: "Relatório completo com período, estatísticas e tabela diária — pronto para levar na consulta.",
  },
  {
    icon: Clock,
    title: "Protocolo 1h ou 2h",
    description: "Configure o protocolo indicado pela sua obstetra e o sistema adapta as metas automaticamente.",
  },
  {
    icon: Shield,
    title: "Histórico sempre salvo",
    description: "Seus dados ficam seguros na nuvem. Acesse de qualquer celular, a qualquer hora.",
  },
  {
    icon: Smartphone,
    title: "Funciona no celular",
    description: "Não precisa instalar nada. Acesse direto pelo navegador do seu smartphone.",
  },
];

const depoimentos = [
  {
    texto: "Chegava sempre na consulta com papéis bagunçados. Com o GlicoGest, chego com o relatório PDF na mão. A médica adorou!",
    nome: "Gestante com DG",
    semana: "32ª semana",
  },
  {
    texto: "Finalmente organizei todas as medições em um lugar só. Consigo ver rapidamente quando estou acima da meta.",
    nome: "Usuária GlicoGest",
    semana: "28ª semana",
  },
  {
    texto: "Simples de usar e o relatório é muito profissional. Vale muito o investimento para facilitar o acompanhamento.",
    nome: "Gestante com DG",
    semana: "36ª semana",
  },
];

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
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
              <p className="text-xs text-gray-500">Glicemia gestacional organizada</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
            >
              Testar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4" fill="currentColor" />
            Feito para gestantes com diabetes gestacional
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Suas medições de glicemia{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
              organizadas
            </span>{" "}
            e prontas para o obstetra
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto mb-4">
            Registre no celular em segundos, acompanhe os valores e gere um relatório PDF completo para levar na consulta. Sem papel, sem planilha, sem confusão.
          </p>
          <p className="text-sm text-pink-600 font-medium mb-10">
            ✓ 4 dias grátis · ✓ Sem cartão de crédito · ✓ Cancele quando quiser
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Começar teste grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#planos" className="px-8 py-4 border-2 border-pink-200 text-pink-600 font-semibold rounded-xl hover:bg-pink-50 transition-all text-lg">
              Ver planos
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Seção de Dor */}
      <section className="bg-gradient-to-r from-pink-50 to-rose-50 border-y border-pink-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 text-pink-700 rounded-full text-sm font-medium mb-4">
              <AlertCircle className="w-4 h-4" />
              Você também faz isso?
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
              A maioria das gestantes com DG anota as medições assim:
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {dores.map((dor, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 bg-white border border-pink-100 rounded-xl p-4"
              >
                <span className="text-rose-400 text-lg flex-shrink-0">✗</span>
                <span className="text-gray-600 text-sm">{dor}</span>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-semibold text-lg mb-4">
              Existe uma forma muito melhor de fazer isso. 👇
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg text-base"
            >
              Testar grátis por 4 dias
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
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

      {/* Depoimentos */}
      <section className="bg-pink-50 border-y border-pink-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-3">O que dizem as gestantes</h3>
            <p className="text-gray-500">Quem já usa o GlicoGest para organizar a gestação</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map((dep, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 card-shadow"
              >
                <Quote className="w-8 h-8 text-pink-200 mb-3" fill="currentColor" />
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{dep.texto}</p>
                <div className="flex items-center gap-2">
                  <div className="bg-pink-100 rounded-full w-8 h-8 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium text-sm">{dep.nome}</p>
                    <p className="text-gray-400 text-xs">{dep.semana}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-4">
          <h3 className="text-3xl font-bold text-gray-800 mb-3">Escolha seu plano</h3>
          <p className="text-gray-500">Registre suas medições, acompanhe seus resultados e gere relatórios para o obstetra.</p>
          <p className="text-pink-600 font-medium mt-3 text-sm">
            Sem assinatura obrigatória. Pagamento único pelo período escolhido.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl p-6 card-shadow transition-all duration-300 flex flex-col ${
                plan.highlight
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
                <h4 className="text-lg font-bold text-gray-800 mb-1">{plan.name}</h4>
                <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? (
                    <span className="text-green-600">Grátis</span>
                  ) : (
                    <span className={plan.highlight ? "text-pink-600" : "text-gray-800"}>
                      {formatPrice(plan.price)}
                    </span>
                  )}
                </div>
                {plan.price > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{plan.durationDays} dias de acesso</p>
                )}
                {plan.id === "free_trial" && <p className="text-xs text-gray-400 mt-1">4 dias · 1 PDF</p>}
                {plan.price > 0 && (
                  <p className="text-xs text-pink-500 font-medium mt-1">
                    R${(plan.price / plan.durationDays).toFixed(2).replace('.', ',')} por dia
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-gray-600 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-pink-500" : "text-green-500"}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block w-full text-center px-4 py-3 font-medium rounded-xl transition-all text-sm ${
                  plan.highlight
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-md"
                    : plan.id === "free_trial"
                    ? "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
                    : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                }`}
              >
                {plan.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Teste grátis por 4 dias com acesso ao sistema e 1 relatório PDF. Após expirar, seus dados permanecem salvos.
        </p>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-pink-500 to-rose-500 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Comece grátis hoje mesmo
          </h3>
          <p className="text-pink-100 mb-8 text-lg">
            4 dias de acesso completo. Sem cartão de crédito. Cancele quando quiser.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-pink-600 font-bold rounded-xl hover:bg-pink-50 transition-all shadow-lg text-lg"
          >
            Testar grátis por 4 dias
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-pink-200 text-xs mt-4">
            ⚕️ O GlicoGest não substitui orientação médica. Consulte sempre seu obstetra.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pink-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
              <span className="font-medium text-gray-500 text-sm">GlicoGest · GlicoGest Inc.</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <Link href="/privacidade" className="hover:text-pink-500 transition-colors">Política de Privacidade</Link>
              <Link href="/termos" className="hover:text-pink-500 transition-colors">Termos de Uso</Link>
              <a href="mailto:glicogestcontrole@gmail.com" className="hover:text-pink-500 transition-colors">Suporte</a>
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs mt-4">
            © 2026 GlicoGest Inc. · Controle Glicêmico Gestacional · Cuidando de você e do seu bebê
          </p>
        </div>
      </footer>
    </div>
  );
}
