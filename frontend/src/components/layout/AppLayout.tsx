import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useThemeStore } from '../../store/themeStore';
import { useEmpresaStore } from '../../store/empresaStore';
import api from '../../lib/api';

export function AppLayout() {
  const { isDarkMode } = useThemeStore();
  const { activeFilial } = useEmpresaStore();

  // Heartbeat do usuário ativo - Avisa ao bot que existe alguém visualizando a tela.
  useEffect(() => {
    if (!activeFilial) return;

    const sendPing = () => {
      api.post('/api/v1/auth/ping', { filial_id: activeFilial.id }).catch(() => {
        // Ignora erros de rede no ping
      });
    };

    // Dispara via POST assim que montar a Home
    sendPing();

    // Mantém informando ao servidor a cada 60s
    const pingInterval = setInterval(sendPing, 60000);

    return () => clearInterval(pingInterval);
  }, [activeFilial]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-hidden ${
      isDarkMode ? 'bg-[#0a0a0a] text-slate-200' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Elementos decorativos de fundo constantes em todo o App (Glassmorphism Orbs) */}
      {isDarkMode && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute top-[40%] right-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        </>
      )}

      {/* Navbar Modular e Flutuante */}
      <Navbar />

      {/* O Outlet é onde as páginas/rotas renderizam. Adicionamos z-10 para ficar acima dos Orbs */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <Outlet />
      </main>

    </div>
  );
}
