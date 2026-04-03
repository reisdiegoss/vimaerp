import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Plus, Loader2, Cpu, MapPin, Activity } from 'lucide-react';
import api from '../../lib/api';
import { useThemeStore } from '../../store/themeStore';
import type { FilialInfo } from '../../store/empresaStore';
import { FilialFormModal } from '../../components/modals/FilialFormModal';

export default function Unidades() {
  const { isDarkMode } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: filiais, isLoading } = useQuery<FilialInfo[]>({
    queryKey: ['filiais_admin'],
    queryFn: async () => {
      const response = await api.get('/api/v1/auth/filiais');
      return response.data;
    }
  });

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex gap-4 items-start">
          <div className={`mt-1 shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-inner ${
            isDarkMode ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-violet-50 text-violet-600'
          }`}>
            <Building2 size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-2">Unidades e Operações</h1>
            <p className={`max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie todas as filiais ligadas a sua conta matriz.
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`shrink-0 whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-violet-500/25 hover:shadow-cyan-500/40' 
              : 'bg-slate-900 text-white shadow-slate-400 hover:shadow-slate-500 hover:bg-slate-800'
          }`}
        >
          <Plus size={18} /> Nova Unidade
        </button>
      </div>

      {/* Grid de Unidades */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20 mt-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className={`animate-spin h-8 w-8 ${isDarkMode ? 'text-violet-500' : 'text-slate-500'}`} />
          </div>
        ) : filiais?.length === 0 ? (
           <div className={`col-span-full text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? 'border-white/20 bg-white/5' : 'border-slate-300 bg-white/50'}`}>
             <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
             <h3 className="text-xl font-bold mb-2">Nenhuma unidade encontrada</h3>
             <p className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Clique no botão acima para adicionar a sua Matriz.</p>
           </div>
        ) : (
          filiais?.map((unit, index) => (
            <div 
              key={unit.id}
              className={`group relative overflow-hidden rounded-3xl p-[1px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-in fade-in fill-mode-both border ${
                isDarkMode 
                  ? 'bg-white/5 border-white/20 hover:bg-gradient-to-r hover:from-violet-500/50 hover:to-cyan-500/50 hover:shadow-violet-500/20' 
                  : 'bg-white border-slate-200 hover:border-violet-400 hover:shadow-violet-500/10'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
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
                    <h3 className="text-xl font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-violet-400 transition-all">
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
                      <span className="truncate">{unit.endereco || 'Endereço Principal'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <FilialFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
