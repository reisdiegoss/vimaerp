import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar
} from 'lucide-react';
import { financeiroService, TipoLancamento, StatusLancamento } from '../api/financeiroService';
import type { LancamentoFinanceiro } from '../api/financeiroService';
import { DashboardCards } from '../components/DashboardCards';
import { ModalNovoLancamento } from '../components/ModalNovoLancamento';
import { ModalBaixaFinanceira } from '../components/ModalBaixaFinanceira';

export default function LancamentosList() {
  const [activeTab, setActiveTab] = useState<'TODOS' | 'RECEITA' | 'DESPESA'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<LancamentoFinanceiro | null>(null);

  // Fetch Lancamentos
  const { data: lancamentos, isLoading } = useQuery({
    queryKey: ['lancamentos', activeTab],
    queryFn: () => financeiroService.getLancamentos(activeTab !== 'TODOS' ? { tipo: activeTab } : {}),
  });

  // Cálculos do Dashboard (baseado no que foi carregado)
  const stats = {
    totalReceitas: lancamentos?.filter(l => l.tipo === TipoLancamento.RECEITA).reduce((acc, curr) => acc + curr.valor, 0) || 0,
    totalDespesas: lancamentos?.filter(l => l.tipo === TipoLancamento.DESPESA).reduce((acc, curr) => acc + curr.valor, 0) || 0,
    totalAtrasado: lancamentos?.filter(l => l.atrasado && l.status === StatusLancamento.PENDENTE).reduce((acc, curr) => acc + curr.valor, 0) || 0,
    get saldoProjetado() { return this.totalReceitas - this.totalDespesas; }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const getStatusBadge = (lancamento: LancamentoFinanceiro) => {
    if (lancamento.status === StatusLancamento.PAGO) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 size={12} /> Pago
        </span>
      );
    }
    if (lancamento.atrasado) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
          <Clock size={12} /> Vencido
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock size={12} /> Pendente
      </span>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Financeiro</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie suas contas, fluxos e categorias em um só lugar.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNovoModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={20} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <DashboardCards 
        totalReceitas={stats.totalReceitas}
        totalDespesas={stats.totalDespesas}
        saldoProjetado={stats.saldoProjetado}
        totalAtrasado={stats.totalAtrasado}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(['TODOS', 'RECEITA', 'DESPESA'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab === 'TODOS' ? 'Todos' : tab === 'RECEITA' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar lançamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Filter size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : lancamentos && lancamentos.length > 0 ? (
                lancamentos.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      {getStatusBadge(l)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(l.data_vencimento).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{l.descricao}</span>
                        <span className="text-xs text-gray-500">{l.documento || 'Sem doc.'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {l.categoria?.nome || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold">
                        {l.tipo === TipoLancamento.RECEITA ? (
                          <ArrowUpCircle size={16} className="text-emerald-500" />
                        ) : (
                          <ArrowDownCircle size={16} className="text-rose-500" />
                        )}
                        <span className={l.tipo === TipoLancamento.RECEITA ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatCurrency(l.valor)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {l.status === StatusLancamento.PENDENTE && (
                          <button 
                            onClick={() => {
                              setSelectedLancamento(l);
                              setIsBaixaModalOpen(true);
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Baixar Título"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    Nenhum lançamento encontrado para o período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      <ModalNovoLancamento 
        isOpen={isNovoModalOpen} 
        onClose={() => setIsNovoModalOpen(false)} 
        tipoPadrao={activeTab === 'RECEITA' ? 'RECEITA' : 'DESPESA'}
      />

      <ModalBaixaFinanceira
        isOpen={isBaixaModalOpen}
        onClose={() => {
          setIsBaixaModalOpen(false);
          setSelectedLancamento(null);
        }}
        lancamento={selectedLancamento}
      />
    </div>
  );
}
