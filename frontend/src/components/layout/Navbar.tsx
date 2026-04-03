import { useState, useRef, useEffect } from 'react';
import { LogOut, Sun, Moon, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEmpresaStore } from '../../store/empresaStore';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate, Link } from 'react-router-dom';

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { activeFilial, clearActiveFilial } = useEmpresaStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="relative z-[100] max-w-7xl mx-auto px-4 sm:px-6 w-full pt-6 mb-2">
      <div className={`flex items-center justify-between p-3 sm:px-4 rounded-2xl backdrop-blur-md border ${
        isDarkMode 
          ? 'bg-white/5 border-white/10 shadow-lg shadow-black/20' 
          : 'bg-white/70 border-slate-200 shadow-sm'
      }`}>
        
        {/* Esquerda: Logo animada Style Tech Hub */}
        <Link to="/app/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80 shrink-0">
          <img 
            src="/logo2.png" 
            alt="VimaERP" 
            className="h-12 w-auto object-contain drop-shadow-md"
          />
        </Link>

        {/* Menu de Navegação Horizontal Central */}
        <div className="hidden lg:flex items-center gap-1 mx-4">
           {[
             { name: 'Dashboard', path: '/app/dashboard' },
           ].map((item) => (
             <Link 
              key={item.path} 
              to={item.path} 
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                window.location.pathname.startsWith(item.path)
                ? (isDarkMode ? 'bg-violet-500/20 text-violet-400 shadow-inner' : 'bg-violet-50 text-violet-600')
                : (isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
              }`}
             >
               {item.name}
             </Link>
           ))}

        </div>

        {/* Centro: Contexto da Unidade. Escondido no mobile. */}
        <div className="flex-1 flex justify-center hidden md:flex">
          {activeFilial ? (
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm animate-in fade-in zoom-in duration-300 ${
              isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white/60 border-slate-200 text-slate-800'
            }`}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm font-bold tracking-wide">{activeFilial.nome}</span>
              <button 
                onClick={() => {
                  clearActiveFilial();
                  navigate('/hub');
                }}
                className={`ml-2 text-xs font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  isDarkMode 
                    ? 'text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20' 
                    : 'text-blue-600 hover:text-blue-800 bg-blue-100/50 hover:bg-blue-100'
                }`}
              >
                Trocar
              </button>
            </div>
          ) : (
            <div className={`text-sm font-medium px-4 py-1.5 rounded-full border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-white/60 border-slate-200 text-slate-500'}`}>
              Hub de Empresas
            </div>
          )}
        </div>

        {/* Direita: Theme Toggle + User Menu (Global) */}
        <div className="flex items-center gap-2 sm:gap-4 relative" ref={dropdownRef}>
          
          <button 
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-yellow-400' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 p-1.5 pr-2 rounded-xl transition-all duration-300 border focus:outline-none ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 border-white/10' 
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shadow-inner ${
              isDarkMode ? 'bg-violet-500/20 text-violet-400' : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:flex flex-col items-start min-w-[80px]">
              <span className={`text-sm font-bold leading-tight truncate max-w-[120px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {user?.nome || 'Usuário'}
              </span>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Admin</span>
            </div>
          </button>

          {/* Dropdown Menu Bruto Tailwind adaptado para o Tema */}
          {dropdownOpen && (
            <div className={`absolute top-16 right-0 mt-1 w-60 rounded-2xl shadow-xl border py-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200 ${
              isDarkMode ? 'bg-[#1a1a1c] border-white/10 shadow-black/50' : 'bg-white border-slate-200'
            }`}>
              <div className={`px-4 py-3 border-b rounded-t-xl -mt-2 mb-2 ${
                isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'
              }`}>
                <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{user?.nome || 'Usuário'}</p>
                <p className={`text-xs font-medium mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{user?.email}</p>
              </div>
              
              
              <div className={`my-1 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}></div>

              <button 
                onClick={() => { setDropdownOpen(false); handleLogout(); }} 
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                  isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut className="w-4 h-4" />
                Sair com Segurança
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
