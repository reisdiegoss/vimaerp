import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Plus, Edit2, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useThemeStore } from '../../store/themeStore';
import { RoleFormModal } from '../../components/modals/RoleFormModal';

interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export default function Perfis() {
  const { isDarkMode } = useThemeStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

  // Queries
  const { data: roles, isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/rbac/roles');
      return data;
    }
  });

  const { data: permissions, isLoading: loadingPerms } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/rbac/permissions');
      return data;
    }
  });

  const handleOpenNew = () => {
    setRoleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setRoleToEdit(role);
    setIsModalOpen(true);
  };

  const isLoading = loadingRoles || loadingPerms;

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex gap-4 items-start">
          <div className={`mt-1 shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-inner ${
            isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-600'
          }`}>
            <Shield size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-2">Perfis de Acesso</h1>
            <p className={`max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Crie grupos de permissões baseados nos cargos (Ex: Balconista, Gerente) para facilitar a vida do seu RH.
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenNew}
          className={`shrink-0 whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/25 hover:shadow-blue-500/40' 
              : 'bg-slate-900 text-white shadow-slate-400 hover:shadow-slate-500 hover:bg-slate-800'
          }`}
        >
          <Plus size={18} /> Novo Perfil
        </button>
      </div>

      {/* Grid de Perfis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 mt-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className={`animate-spin h-8 w-8 ${isDarkMode ? 'text-cyan-500' : 'text-blue-500'}`} />
          </div>
        ) : roles?.length === 0 ? (
          <div className={`col-span-full text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? 'border-white/20 bg-white/5' : 'border-slate-300 bg-white/50'}`}>
            <Shield className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
            <h3 className="text-xl font-bold mb-2">Nenhum perfil criado</h3>
            <p className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>
              Clique no botão acima para criar o seu primeiro Perfil.
            </p>
          </div>
        ) : (
          roles?.map((role, idx) => (
            <div 
              key={role.id}
              className={`relative group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 animate-in fade-in fill-mode-both border ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10' 
                  : 'bg-white border-slate-200 hover:border-cyan-400 hover:shadow-xl shadow-sm'
              }`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{role.name}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isDarkMode ? 'bg-white/10 text-cyan-400' : 'bg-slate-100 text-cyan-600'
                  }`}>
                    {role.permissions?.length || 0} Direitos Liberados
                  </div>
                </div>
                
                <button 
                  onClick={() => handleOpenEdit(role)}
                  className={`p-2.5 rounded-xl transition-colors ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Edit2 size={16} />
                </button>
              </div>
              
              {/* Preview das permissões (até 3) */}
              <div className="space-y-2">
                {role.permissions?.slice(0, 3).map(p => (
                  <div key={p.id} className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-400'}`}></div>
                     {p.name.split('.').join(' ').toUpperCase()}
                  </div>
                ))}
                {(role.permissions?.length || 0) > 3 && (
                  <div className={`text-xs mt-2 pl-3.5 italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    + {(role.permissions.length) - 3} mais...
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
        availablePermissions={permissions || []}
        roleToEdit={roleToEdit}
      />
    </div>
  );
}
