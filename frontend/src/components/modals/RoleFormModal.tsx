import { useState, useEffect } from 'react';
import { X, Shield, Lock, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';

interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availablePermissions: Permission[];
  roleToEdit?: { id: number; name: string; permissions: Permission[] } | null;
}

export function RoleFormModal({ isOpen, onClose, onSuccess, availablePermissions, roleToEdit }: RoleFormModalProps) {
  const { isDarkMode } = useThemeStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

  // Popular estado se for edição
  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name);
      setSelectedPermissions(new Set(roleToEdit.permissions.map(p => p.id)));
    } else {
      setName('');
      setSelectedPermissions(new Set());
    }
  }, [roleToEdit, isOpen]);

  if (!isOpen) return null;

  const togglePermission = (id: number) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPermissions(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      const payload = {
        name,
        permission_ids: Array.from(selectedPermissions)
      };

      if (roleToEdit) {
        await api.put(`/api/v1/rbac/roles/${roleToEdit.id}`, payload);
      } else {
        await api.post('/api/v1/rbac/roles', payload);
      }
      
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSuccess();
    } catch (error: any) {
      setErrorStatus(error.response?.data?.detail || 'Erro ao salvar Perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass = `w-full px-4 py-3 rounded-xl transition-all outline-none border ${
    isDarkMode 
      ? 'bg-[#111] border-white/10 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50' 
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30'
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-2xl h-full max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
        isDarkMode ? 'bg-[#0f0f11] border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
              <Shield size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {roleToEdit ? 'Editar Perfil' : 'Novo Perfil de Acesso'}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure os direitos que os usuários deste perfil terão.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
          {errorStatus && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium shrink-0">
              {errorStatus}
            </div>
          )}

          <div className="shrink-0">
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nome do Perfil *</label>
            <input 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Gerente de Loja" 
              className={inputBaseClass} 
            />
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Lock size={16} /> Permissões Vinculadas
            </h3>
            
            <div className={`flex-1 overflow-y-auto rounded-xl border p-4 ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
              {availablePermissions.length === 0 ? (
                <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Carregando permissões do sistema...
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availablePermissions.map(perm => {
                    const isSelected = selectedPermissions.has(perm.id);
                    return (
                      <div 
                        key={perm.id} 
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          isSelected 
                            ? (isDarkMode ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-blue-50 border-blue-200')
                            : (isDarkMode ? 'bg-transparent border-white/5 hover:border-white/20' : 'bg-transparent border-slate-100 hover:border-slate-300')
                        }`}
                      >
                       <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                         isSelected 
                          ? (isDarkMode ? 'bg-cyan-500 border-cyan-500 text-[#0f0f11]' : 'bg-blue-600 border-blue-600 text-white')
                          : (isDarkMode ? 'border-slate-600 bg-transparent' : 'border-slate-300 bg-white')
                       }`}>
                         {isSelected && <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                       </div>
                       <div>
                         <p className={`text-sm font-semibold ${isDarkMode ? (isSelected ? 'text-cyan-400' : 'text-slate-300') : (isSelected ? 'text-blue-700' : 'text-slate-700')}`}>
                           {perm.name.split('.').join(' ').toUpperCase()}
                         </p>
                         <p className={`text-[10px] sm:text-xs mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                           {perm.name}
                         </p>
                       </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={`shrink-0 pt-6 border-t flex justify-end gap-3 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-slate-300' 
                  : 'hover:bg-slate-200 text-slate-700 bg-slate-100'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Salvando...</>
              ) : (
                <>{roleToEdit ? 'Atualizar Perfil' : 'Criar Perfil'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
