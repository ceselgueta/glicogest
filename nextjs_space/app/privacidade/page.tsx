import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade — GlicoGest',
  description: 'Política de Privacidade do GlicoGest',
};

export default function PrivacidadePage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-sm text-gray-400 mb-8">Última atualização: {dataAtualizacao}</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Quem somos</h2>
              <p>O GlicoGest é um serviço digital operado pela <strong>GlicoGest Inc.</strong>, com suporte disponível pelo e-mail <a href="mailto:glicogestcontrole@gmail.com" className="text-pink-500 underline">glicogestcontrole@gmail.com</a>. Nosso serviço tem como objetivo ajudar gestantes com diabetes gestacional a organizar e acompanhar suas medições de glicemia.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Dados que coletamos</h2>
              <p>Ao utilizar o GlicoGest, podemos coletar os seguintes dados:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Dados de cadastro:</strong> nome, endereço de e-mail e senha (armazenada de forma criptografada).</li>
                <li><strong>Dados de saúde:</strong> medições de glicemia, datas, tipos de medição, sintomas e observações inseridas pela usuária.</li>
                <li><strong>Dados da gestação:</strong> semana gestacional, data provável do parto, nome da obstetra e metas glicêmicas.</li>
                <li><strong>Dados de pagamento:</strong> identificadores de transação do Mercado Pago (não armazenamos dados de cartão de crédito).</li>
                <li><strong>Dados de uso:</strong> logs de acesso, tipo de dispositivo e navegador, para fins de melhoria do serviço.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Como usamos seus dados</h2>
              <p>Utilizamos seus dados exclusivamente para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Fornecer e operar o serviço GlicoGest;</li>
                <li>Gerar relatórios em PDF para apresentação à equipe de saúde;</li>
                <li>Processar pagamentos e gerenciar planos de acesso;</li>
                <li>Enviar comunicações relacionadas ao serviço (como confirmações de pagamento);</li>
                <li>Melhorar a experiência do usuário e corrigir problemas técnicos.</li>
              </ul>
              <p className="mt-3"><strong>Não vendemos, compartilhamos ou comercializamos seus dados pessoais ou de saúde com terceiros.</strong></p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Compartilhamento de dados</h2>
              <p>Seus dados podem ser compartilhados apenas com os seguintes prestadores de serviço essenciais para o funcionamento da plataforma:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Neon (banco de dados):</strong> armazenamento seguro dos dados em servidores na América do Sul.</li>
                <li><strong>Vercel (hospedagem):</strong> infraestrutura de servidores da aplicação.</li>
                <li><strong>Mercado Pago (pagamentos):</strong> processamento de transações financeiras.</li>
                <li><strong>Google (autenticação):</strong> login social via Google OAuth, quando utilizado.</li>
              </ul>
              <p className="mt-3">Todos os prestadores acima estão sujeitos às suas próprias políticas de privacidade e não têm autorização para usar seus dados para fins próprios.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Segurança dos dados</h2>
              <p>Adotamos medidas técnicas e organizacionais para proteger suas informações:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Transmissão de dados criptografada via HTTPS/TLS;</li>
                <li>Senhas armazenadas com criptografia bcrypt;</li>
                <li>Banco de dados com acesso restrito e autenticação por credenciais seguras;</li>
                <li>Acesso ao painel administrativo limitado aos responsáveis pelo serviço.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Seus direitos (LGPD)</h2>
              <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Confirmar a existência de tratamento dos seus dados;</li>
                <li>Acessar seus dados pessoais armazenados;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar a exclusão dos seus dados pessoais;</li>
                <li>Revogar o consentimento dado para o tratamento dos dados.</li>
              </ul>
              <p className="mt-3">Para exercer esses direitos, entre em contato: <a href="mailto:glicogestcontrole@gmail.com" className="text-pink-500 underline">glicogestcontrole@gmail.com</a></p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Retenção de dados</h2>
              <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são removidos em até 30 dias, exceto quando a retenção for exigida por obrigação legal.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Cookies</h2>
              <p>O GlicoGest utiliza cookies essenciais para o funcionamento da sessão de login e autenticação. Não utilizamos cookies de rastreamento ou publicidade comportamental.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Menores de idade</h2>
              <p>O GlicoGest não é destinado a menores de 18 anos. Caso identificarmos cadastros de menores, procederemos com a exclusão da conta.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Alterações nesta política</h2>
              <p>Podemos atualizar esta Política de Privacidade periodicamente. Quando houver alterações relevantes, notificaremos por e-mail ou por aviso na plataforma. O uso continuado do serviço após as alterações implica aceitação da nova política.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Contato</h2>
              <p>Dúvidas sobre esta política ou sobre o tratamento dos seus dados:</p>
              <p className="mt-2"><strong>GlicoGest Inc.</strong><br />
              E-mail: <a href="mailto:glicogestcontrole@gmail.com" className="text-pink-500 underline">glicogestcontrole@gmail.com</a></p>
            </section>

          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/termos" className="text-sm text-pink-500 hover:underline">
            Ver Termos de Uso →
          </Link>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        © 2026 GlicoGest Inc. · <Link href="/privacidade" className="hover:underline">Privacidade</Link> · <Link href="/termos" className="hover:underline">Termos</Link>
      </footer>
    </div>
  );
}
