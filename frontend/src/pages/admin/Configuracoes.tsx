import { Settings, Save } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export default function Configuracoes() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex gap-4 items-start">
          <div className={`mt-1 shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-inner ${
            isDarkMode ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600'
          }`}>
            <Settings size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-2">Configurações Globais</h1>
            <p className={`max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie parâmetros que afetam o funcionamento sistêmico de todas as suas unidades em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="space-y-8">
        <section className={`rounded-3xl p-8 border ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-xl font-bold mb-6 pb-4 border-b border-slate-200 dark:border-white/10">Identidade da Matriz</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nome de Exibição Global</label>
              <input
                type="text"
                defaultValue="Vima Sistemas Matriz"
                className={`w-full px-4 py-3 rounded-xl border font-medium outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-[#111] border-white/10 focus:border-violet-500 text-white placeholder-slate-500' 
                    : 'bg-white border-slate-200 focus:border-violet-500 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Fuso Horário Padrão</label>
              <select
                className={`w-full px-4 py-3 rounded-xl border font-medium outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-[#111] border-white/10 focus:border-violet-500 text-white' 
                    : 'bg-white border-slate-200 focus:border-violet-500 text-slate-900'
                }`}
              >
                <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-03:00)</option>
                <option value="America/Manaus">America/Manaus (UTC-04:00)</option>
              </select>
            </div>

            <div className="md:col-span-2 mt-4 flex justify-end">
              <button className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-violet-500/25' 
                  : 'bg-slate-900 text-white shadow-slate-400 hover:bg-slate-800'
              }`}>
                <Save size={18} /> Salvar Alterações Globais
              </button>
            </div>
          </div>
        </section>

        <section className={`rounded-3xl p-8 border ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-xl font-bold mb-2 text-red-500">Zona de Perigo</h3>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ações irreversíveis para a sua conta corporativa.</p>
          
          <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div>
              <h4 className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Excluir Matriz e Filiais</h4>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ao excluir sua matriz, todas as operações, VimaBOTs e acessos ligados a ela serão permanentemente rompidos.</p>
            </div>
            <button className="whitespace-nowrap px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shrink-0">
              Solicitar Exclusão
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
