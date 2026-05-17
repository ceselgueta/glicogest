import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Termos de Uso — GlicoGest',
  description: 'Termos de Uso do GlicoGest',
};

export default function TermosPage() {
  const dataAtualizacao = '17 de maio de 2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-pink-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-pink-500 font-bold text-lg">
            <Heart className="w-5 h-5 fill-pink-500" />
            GlicoGest
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
          <p className="text-sm text-gray-400 mb-8">Última atualização: {dataAtualizacao}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-amber-800 font-medium">⚠️ Aviso importante</p>
            <p className="text-sm text-amber-700 mt-1">O GlicoGest é uma ferramenta de organização e registro pessoal. <strong>Não substitui orientação médica, diagnóstico ou tratamento.</strong> Consulte sempre sua obstetra ou equipe de saúde.</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Aceitação dos Termos</h2>
              <p>Ao criar uma conta e utilizar o GlicoGest, você concorda com estes Termos de Uso e com nossa <Link href="/privacidade" className="text-pink-500 underline">Política de Privacidade</Link>. Se não concordar com qualquer parte destes termos, não utilize o serviço.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Descrição do serviço</h2>
              <p>O GlicoGest é uma plataforma digital que permite:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Registrar e organizar medições de glicemia durante a gestação;</li>
                <li>Acompanhar valores dentro ou acima das metas estabelecidas pela equipe médica;</li>
                <li>Configurar protocolos de medição (1h ou 2h após refeições);</li>
                <li>Gerar relatórios em PDF para apresentação ao obstetra.</li>
              </ul>
              <p className="mt-3">O serviço é uma ferramenta de <strong>organização e apoio</strong> ao acompanhamento médico, não substituindo em nenhuma hipótese a consulta, o diagnóstico ou o tratamento médico.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Limitação médica</h2>
              <p>O GlicoGest <strong>não é um dispositivo médico, não presta serviços de saúde e não fornece diagnósticos ou recomendações clínicas.</strong> As informações exibidas no sistema são baseadas exclusivamente nos dados inseridos pela própria usuária.</p>
              <p className="mt-2">Qualquer decisão de saúde deve ser tomada em conjunto com seu médico ou equipe de saúde qualificada. O GlicoGest não se responsabiliza por decisões médicas baseadas nos dados registrados na plataforma.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Cadastro e conta</h2>
              <p>Para utilizar o GlicoGest, você deve:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Ter 18 anos ou mais;</li>
                <li>Fornecer informações verdadeiras no cadastro;</li>
                <li>Manter a confidencialidade de suas credenciais de acesso;</li>
                <li>Notificar imediatamente o suporte em caso de acesso não autorizado à sua conta.</li>
              </ul>
              <p className="mt-3">Você é responsável por todas as atividades realizadas em sua conta.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Planos e pagamentos</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Teste grátis:</strong> 4 dias de acesso completo, uso único por conta, sem necessidade de cartão de crédito.</li>
                <li><strong>Plano Mensal:</strong> R$14,90 por 30 dias de acesso.</li>
                <li><strong>Plano 3 Meses:</strong> R$34,90 por 90 dias de acesso.</li>
                <li><strong>Plano Gestação Completa:</strong> R$59,90 por 270 dias de acesso.</li>
              </ul>
              <p className="mt-3">Os pagamentos são processados pelo Mercado Pago. Não há assinatura automática — cada plano é um pagamento único pelo período contratado. Não há reembolso após a ativação do plano.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Uso adequado</h2>
              <p>É vedado ao usuário:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Utilizar o serviço para fins ilegais ou que violem direitos de terceiros;</li>
                <li>Tentar acessar contas de outros usuários;</li>
                <li>Realizar engenharia reversa ou tentativas de invasão do sistema;</li>
                <li>Compartilhar credenciais de acesso com terceiros;</li>
                <li>Inserir dados falsos ou maliciosos na plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Disponibilidade do serviço</h2>
              <p>O GlicoGest se esforça para manter o serviço disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta e não nos responsabilizamos por eventuais interrupções causadas por manutenção, falhas técnicas ou fatores fora do nosso controle.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Propriedade intelectual</h2>
              <p>Todo o conteúdo do GlicoGest — incluindo marca, design, código e funcionalidades — é de propriedade da GlicoGest Inc. Os dados inseridos pela usuária pertencem exclusivamente a ela.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Limitação de responsabilidade</h2>
              <p>O GlicoGest não se responsabiliza por:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Decisões médicas baseadas nos dados registrados na plataforma;</li>
                <li>Perda de dados por falha do usuário em manter suas credenciais seguras;</li>
                <li>Danos indiretos decorrentes do uso ou impossibilidade de uso do serviço.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Cancelamento e exclusão</h2>
              <p>Você pode solicitar a exclusão da sua conta a qualquer momento pelo e-mail <a href="mailto:glicogestcontrole@gmail.com" className="text-pink-500 underline">glicogestcontrole@gmail.com</a>. Após a exclusão, todos os seus dados serão removidos em até 30 dias. Planos já pagos não são reembolsáveis.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Alterações nos Termos</h2>
              <p>Podemos atualizar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas por e-mail ou por aviso na plataforma com pelo menos 7 dias de antecedência. O uso continuado após as alterações implica aceitação dos novos termos.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">12. Lei aplicável</h2>
              <p>Estes Termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro da comarca de São Paulo/SP.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">13. Contato e suporte</h2>
              <p><strong>GlicoGest Inc.</strong><br />
              E-mail: <a href="mailto:glicogestcontrole@gmail.com" className="text-pink-500 underline">glicogestcontrole@gmail.com</a><br />
              Atendimento de segunda a sexta, das 9h às 18h (horário de Brasília).</p>
            </section>

          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/privacidade" className="text-sm text-pink-500 hover:underline">
            Ver Política de Privacidade →
          </Link>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        © 2026 GlicoGest Inc. · <Link href="/privacidade" className="hover:underline">Privacidade</Link> · <Link href="/termos" className="hover:underline">Termos</Link>
      </footer>
    </div>
  );
}
