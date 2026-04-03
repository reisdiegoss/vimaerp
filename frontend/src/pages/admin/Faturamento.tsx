import { CreditCard, Download, CheckCircle2, Zap } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export default function Faturamento() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex gap-4 items-start">
          <div className={`mt-1 shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-inner ${
            isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <CreditCard size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-2">Faturamento e Assinatura</h1>
            <p className={`max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie seu plano, faturas e métodos de pagamento.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className={`rounded-3xl p-8 mb-8 border ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b pb-8 border-slate-200 dark:border-white/10">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${
              isDarkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
            }`}>
              <Zap size={14} /> PLANO ATUAL
            </div>
            <h2 className="text-4xl font-black mb-2">VimaERP Pro</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
              Custo mensal base de R$ 299,00/mês + Adicionais
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Próximo Vencimento</p>
            <p className="text-2xl font-bold">15 de Abril de 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Limites do Plano</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-emerald-500" /> Até 5 Filiais CNPJs</li>
              <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-emerald-500" /> Usuários Ilimitados</li>
              <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-emerald-500" /> 15GB Armazenamento</li>
            </ul>
          </div>
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Módulos Ativos</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-cyan-500" /> VimaBOT (Incluso)</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-cyan-500" /> Gestão de Estoque</li>
              <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-cyan-500" /> Emissor NF-e/NFC-e</li>
            </ul>
          </div>
          <div className="flex flex-col justify-end">
            <button className={`w-full py-3 rounded-xl font-bold transition-colors ${
              isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            }`}>
              Fazer Upgrade / Add CNPJ
            </button>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <h3 className="text-xl font-bold mb-4 mt-10">Histórico de Faturas</h3>
      <div className={`rounded-2xl border overflow-hidden ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <table className="w-full text-sm text-left">
          <thead className={`text-xs uppercase border-b ${
            isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider">Data</th>
              <th className="px-6 py-4 font-bold tracking-wider">Valor</th>
              <th className="px-6 py-4 font-bold tracking-wider">Status</th>
              <th className="px-6 py-4 font-bold tracking-wider text-right">Recibo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/10">
            {[
              { id: 1, date: '15 Mar 2026', amount: 'R$ 299,00', status: 'PAID' },
              { id: 2, date: '15 Fev 2026', amount: 'R$ 299,00', status: 'PAID' },
            ].map(f => (
              <tr key={f.id} className={isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                <td className="px-6 py-4 font-medium">{f.date}</td>
                <td className="px-6 py-4">{f.amount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    f.status === 'PAID' 
                      ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {f.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}>
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
