import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  LogOut, 
  Moon, 
  Sun, 
  Search, 
  ArrowRight, 
  MapPin, 
  Cpu, 
  Activity,
  Loader2,
  Settings
} from 'lucide-react';

import api from '../lib/api';
import { useEmpresaStore } from '../store/empresaStore';
import type { FilialInfo } from '../store/empresaStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Hub() {
  const navigate = useNavigate();
  const { setActiveFilial } = useEmpresaStore();
  const { logout, user } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  const [searchTerm, setSearchTerm] = useState('');

  const { data: filiais, isLoading, isError } = useQuery<FilialInfo[]>({
    queryKey: ['filiais'],
    queryFn: async () => {
      const response = await api.get('/api/v1/auth/filiais');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, 
  });

  const handleSelectFilial = (filial: FilialInfo) => {
    setActiveFilial(filial);
    navigate('/app/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredUnits = filiais?.filter(unit => 
    unit.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.cnpj && unit.cnpj.includes(searchTerm))
  ) || [];

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0a] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
        <Loader2 className={`animate-spin h-10 w-10 mb-4 ${isDarkMode ? 'text-violet-500' : 'text-blue-600'}`} />
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Sincronizando unidades...</p>
      </div>
    );
  }

  if (isError || !filiais || filiais.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0a] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
        <div className={`rounded-3xl p-8 max-w-md w-full text-center border backdrop-blur-md ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white shadow border-slate-200'}`}>
          <div className="bg-red-500/10 text-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Acesso Negado</h2>
          <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Nenhuma unidade operacional vinculada ao seu usuário. Contate a administração.
          </p>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <LogOut size={18} />
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${
      isDarkMode ? 'bg-[#0a0a0a] text-slate-200' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Elementos decorativos de fundo */}
      {isDarkMode && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute top-[40%] right-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        </>
      )}

      {/* NAVBAR FLUTUANTE */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 pt-6">
        <div className={`flex items-center justify-between p-4 rounded-2xl backdrop-blur-md border ${
          isDarkMode 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white/70 border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <img 
              src="/logo2.png" 
              alt="VimaHub" 
              className="h-14 w-auto object-contain drop-shadow"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-300 mr-1 ${
                isDarkMode 
                  ? 'bg-white/5 hover:bg-white/10 text-yellow-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user?.is_admin && (
              <button 
                onClick={() => navigate('/minha-conta')}
                className={`flex items-center gap-2 p-2.5 px-4 rounded-xl font-medium transition-all duration-300 mr-1 ${
                isDarkMode 
                  ? 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20' 
                  : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
              }`}>
                <Settings size={18} />
                <span className="hidden sm:inline">Minha Conta</span>
              </button>
            )}
            <button 
              onClick={handleLogout}
              className={`flex items-center gap-2 p-2.5 px-4 rounded-xl font-medium transition-all duration-300 ${
              isDarkMode 
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
            }`}>
              <LogOut size={18} />
              <span className="hidden sm:inline">Desconectar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-16">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 border ${
            isDarkMode ? 'bg-white/5 border-white/10 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            Sessão Sincronizada
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Acesse seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">Workspace</span>
          </h2>
          <p className={`text-lg max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Bem-vindo de volta, <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{user?.nome || 'Usuário'}</strong>. Escolha a unidade que deseja operar.
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="flex justify-center mb-12 animate-in fade-in duration-1000 delay-150 fill-mode-both">
          <div className="relative w-full max-w-2xl group">
            <div className={`absolute inset-0 rounded-full blur transition-all duration-300 group-hover:blur-md ${
              isDarkMode ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30' : 'bg-slate-200'
            }`}></div>
            <div className="relative flex items-center">
              <Search className={`absolute left-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} size={20} />
              <input
                type="text"
                placeholder="Localize sua unidade por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-14 pr-6 py-4 rounded-full outline-none transition-all border ${
                  isDarkMode 
                    ? 'bg-[#111] border-white/10 focus:border-violet-500 text-white placeholder-slate-500' 
                    : 'bg-white border-slate-200 focus:border-violet-500 shadow-sm text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* GRID DE UNIDADES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 mt-4">
          {filteredUnits.length > 0 ? (
            filteredUnits.map((unit, index) => (
              <div 
                key={unit.id}
                onClick={() => handleSelectFilial(unit)}
                className={`group cursor-pointer relative overflow-hidden rounded-3xl p-[1px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-8 fill-mode-both border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/20 hover:bg-gradient-to-r hover:from-violet-500/50 hover:to-cyan-500/50 hover:shadow-violet-500/20' 
                    : 'bg-white border-slate-200 hover:border-violet-400 hover:shadow-violet-500/10'
                }`}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <div className={`relative h-full flex flex-col justify-between p-7 rounded-[1.4rem] ${
                  isDarkMode ? 'bg-[#0f0f11]' : 'bg-white'
                }`}>
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl ${
                        isDarkMode 
                          ? 'bg-white/5 text-cyan-400 group-hover:bg-cyan-400/10' 
                          : 'bg-slate-50 text-cyan-600 group-hover:bg-cyan-50'
                      } transition-colors`}>
                        <Building2 size={28} strokeWidth={1.5} />
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
                        isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <Activity size={14} className="animate-pulse" />
                        <span className="tabular-nums">{unit.conectados || 0} conectados</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-6">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? 'text-violet-400' : 'text-violet-600'
                      }`}>
                        {unit.nome.includes('Matriz') ? 'Matriz' : 'Filial Operacional'}
                      </span>
                      <h3 className="text-2xl font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-violet-400 transition-all">
                        {unit.nome}
                      </h3>
                    </div>
                    
                    <div className={`space-y-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {unit.cnpj && (
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                            <Cpu size={14} />
                          </div>
                          <span className="font-mono">{unit.cnpj}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                          <MapPin size={14} />
                        </div>
                        <span>Acesso Autorizado</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 w-full group/btn overflow-hidden rounded-xl p-[1px]">
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl opacity-70 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                    <div className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-[#0f0f11] text-white group-hover/btn:bg-transparent' 
                        : 'bg-white text-slate-900 group-hover/btn:bg-transparent group-hover/btn:text-white'
                    }`}>
                      Acessar Sistema
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="col-span-full py-20 text-center animate-in fade-in duration-500">
               <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                 isDarkMode ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400'
               }`}>
                 <Search size={32} />
               </div>
               <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Unidade não encontrada</h3>
               <p className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Verifique a ortografia ou o CNPJ procurado.</p>
             </div>
          )}
        </div>
      </main>

    </div>
  );
}
