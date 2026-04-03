import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Shield, 
  CreditCard, 
  Settings, 
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export function MinhaContaLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  // Redireciona se não for admin (dupla proteção)
  if (!user?.is_admin) {
    navigate('/hub');
    return null;
  }

  const navItems = [
    { path: '/minha-conta/unidades', icon: Building2, label: 'Unidades' },
    { path: '/minha-conta/usuarios', icon: Users, label: 'Equipe' },
    { path: '/minha-conta/perfis', icon: Shield, label: 'Perfis e Acessos' },
    { path: '/minha-conta/faturamento', icon: CreditCard, label: 'Faturamento' },
    { path: '/minha-conta/configuracoes', icon: Settings, label: 'Configurações Globais' },
  ];

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${
      isDarkMode ? 'bg-[#0a0a0a] text-slate-200' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* SIDEBAR */}
      <aside className={`w-72 flex flex-col border-r ${
        isDarkMode ? 'bg-[#111] border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="p-6">
          <button 
            onClick={() => navigate('/hub')}
            className={`flex items-center gap-2 mb-8 text-sm font-medium transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>
          
          <div className="mb-6">
            <h1 className="text-2xl font-black">Minha Conta</h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Gestão corporativa do painel
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? (isDarkMode ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'bg-violet-600 text-white shadow-md shadow-violet-200')
                    : (isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className={`flex items-center gap-3 p-3 rounded-xl ${
            isDarkMode ? 'bg-white/5' : 'bg-slate-50'
          }`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-violet-600 bg-violet-100`}>
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.nome}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
