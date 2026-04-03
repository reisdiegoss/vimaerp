import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Search, Edit2, Trash2, Shield } from 'lucide-react';
import api from '../../lib/api';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { UserFormModal } from '../../components/modals/UserFormModal';

interface UserListResponse {
  id: string;
  nome: string;
  email: string;
  is_admin: boolean;
  role: string;
  filiais: string[];
}

export default function Usuarios() {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch users from our new backend API endpoint
  const { data: users, isLoading } = useQuery<UserListResponse[]>({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const response = await api.get('/api/v1/users/');
      return response.data;
    }
  });

  // Proteção da tela apenas para admin
  if (!user?.is_admin) {
    return (
      <div className={`flex items-center justify-center p-8 text-center text-red-500 font-bold`}>
        Acesso restrito a administradores.
      </div>
    );
  }

  // Filter users
  const filteredUsers = users?.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Equipe e Usuários</h1>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
            Controle de acessos, papéis (RBAC) e filiais autorizadas para sua equipe.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-violet-500/25 hover:shadow-cyan-500/40' 
              : 'bg-slate-900 text-white shadow-sm hover:shadow-md hover:bg-slate-800'
          }`}>
            <UserPlus size={18} /> Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md mb-8 group animate-in fade-in duration-700 delay-200">
        <div className={`absolute inset-0 rounded-full blur transition-all duration-300 group-hover:blur-md ${
          isDarkMode ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30' : 'bg-slate-200'
        }`}></div>
        <div className="relative flex items-center">
          <Search className={`absolute left-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-full outline-none transition-all border text-sm ${
              isDarkMode 
                ? 'bg-[#111] border-white/10 focus:border-violet-500 text-white placeholder-slate-500' 
                : 'bg-white border-slate-200 focus:border-violet-500 shadow-sm text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className={`rounded-2xl border overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 ${
        isDarkMode ? 'bg-white/5 border-white/10 shadow-black/50' : 'bg-white shadow border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase border-b ${
              isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="px-6 py-5 font-bold tracking-wider">Usuário</th>
                <th className="px-6 py-5 font-bold tracking-wider">Perfil / Role</th>
                <th className="px-6 py-5 font-bold tracking-wider">Unidades Vinculadas</th>
                <th className="px-6 py-5 font-bold tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-10">Carregando usuários...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                filteredUsers.map((u: UserListResponse) => (
                  <tr key={u.id} className={`transition-colors ${
                    isDarkMode ? 'hover:bg-white/5 border-white/10' : 'hover:bg-slate-50 border-slate-100'
                  }`}>
                    <td className="px-6 py-5 min-w-[200px]">
                      <div className="flex flex-col">
                        <span className={`font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{u.nome}</span>
                        <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                        u.role === 'admin' 
                          ? (isDarkMode ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-violet-50 text-violet-700 border-violet-200')
                          : (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200')
                      }`}>
                        {u.role === 'admin' && <Shield size={14} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {u.filiais.map(filial => (
                          <span key={filial} className={`px-2.5 py-1 flex items-center gap-1 rounded-md border text-xs font-bold ${
                            isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                          }`}>
                            {filial}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className={`p-2.5 rounded-xl transition-all ${
                          isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white border border-transparent hover:border-white/10' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900 hover:shadow-sm'
                        }`}>
                          <Edit2 size={16} />
                        </button>
                        <button className={`p-2.5 rounded-xl transition-all ${
                          isDarkMode ? 'hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-transparent hover:border-red-500/20' : 'hover:bg-red-50 text-red-500 hover:text-red-700 hover:border-red-200 border border-transparent'
                        }`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renderização do Modal */}
      <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
