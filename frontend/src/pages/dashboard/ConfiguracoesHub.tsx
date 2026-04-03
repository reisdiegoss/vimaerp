import { Building2, FileText, CreditCard, Users, ArrowRight, ChevronLeft } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AsaasConfigModal } from '../../features/integracoes/components/AsaasConfigModal';
import { PrefixosConfigModal } from '../../features/configuracoes/components/PrefixosConfigModal';

export default function ConfiguracoesHub() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [isAsaasModalOpen, setIsAsaasModalOpen] = useState(false);
  const [isPrefixosModalOpen, setIsPrefixosModalOpen] = useState(false);

  const configCards = [
    {
      title: 'Minha Empresa',
      description: 'Gerencie dados cadastrais, CNPJ, logotipos e endereços das suas unidades.',
      icon: <Building2 className="w-6 h-6" />,
      link: '/app/perfil',
      color: 'blue'
    },
    {
      title: 'Fiscal e Tributário',
      description: 'Configurações de NFe, certificados digitais e regras de impostos.',
      icon: <FileText className="w-6 h-6" />,
      link: '/app/fiscal',
      color: 'amber'
    },
    {
      title: 'Sequenciais e Documentos',
      description: 'Personalize os prefixos (ex: VEN, CLI, OS) gerados para essa unidade (Filial).',
      icon: <FileText className="w-6 h-6" />,
      onClick: () => setIsPrefixosModalOpen(true),
      color: 'indigo'
    },
    {
      title: 'Integrações Financeiras',
      description: 'Ative a automação do Asaas para recebimentos automáticos via Boleto e PIX.',
      icon: <CreditCard className="w-6 h-6" />,
      onClick: () => setIsAsaasModalOpen(true),
      color: 'emerald'
    },
    {
      title: 'Usuários e Permissões',
      description: 'Convide sua equipe e defina o que cada colaborador pode acessar no sistema.',
      icon: <Users className="w-6 h-6" />,
      link: '/minha-conta/usuarios',
      color: 'violet'
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Breadcrumbs Discreto */}
      <nav className={`flex items-center gap-2 text-xs font-bold mb-4 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <Link to="/app/dashboard" className="hover:text-violet-500 transition-colors">Home</Link>
        <span>/</span>
        <span className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>Configurações</span>
      </nav>

      {/* Header do Hub */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app/dashboard')}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-black mb-1 tracking-tight">Hub de Configurações</h1>
            <p className={`text-lg max-w-2xl font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              A central de controle do seu VimaERP. Ajuste as engrenagens da sua operação em um só lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {configCards.map((card) => {
          const CardContent = (
            <>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-transform group-hover:scale-110 duration-300 ${
                isDarkMode 
                  ? `bg-${card.color}-500/10 text-${card.color}-400 border border-${card.color}-500/20` 
                  : `bg-${card.color}-50 text-${card.color}-600`
              }`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-500 transition-colors">{card.title}</h3>
              <p className={`text-sm leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {card.description}
              </p>
              <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-500">
                Acessar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </>
          );

          const cardClassName = `group relative flex flex-col p-8 rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
            isDarkMode 
              ? 'bg-[#1a1a1c]/80 border-white/5 hover:border-cyan-500/50 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)] shadow-xl shadow-black/20' 
              : 'bg-white border-slate-100 hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-100 shadow-sm'
          }`;

          if (card.link) {
            return (
              <Link key={card.title} to={card.link} className={cardClassName}>
                {CardContent}
              </Link>
            );
          }

          return (
            <div key={card.title} onClick={card.onClick} className={cardClassName}>
              {CardContent}
            </div>
          );
        })}
      </div>

      {/* Modal de Integração Asaas */}
      <AsaasConfigModal isOpen={isAsaasModalOpen} onClose={() => setIsAsaasModalOpen(false)} />
      
      {/* Modal de Prefixos de Unidade */}
      <PrefixosConfigModal isOpen={isPrefixosModalOpen} onClose={() => setIsPrefixosModalOpen(false)} />

    </div>
  );
}
