
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useEmpresaStore } from './store/empresaStore';
import { useThemeStore } from './store/themeStore';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

import Login from './pages/Login';
import Hub from './pages/Hub';
import Usuarios from './pages/admin/Usuarios';
import Perfis from './pages/admin/Perfis';
import Unidades from './pages/admin/Unidades';
import Faturamento from './pages/admin/Faturamento';
import Configuracoes from './pages/admin/Configuracoes';
import { MinhaContaLayout } from './pages/admin/MinhaContaLayout';
import Dashboard from './pages/dashboard/Dashboard';
import ConfiguracoesHub from './pages/dashboard/ConfiguracoesHub';
import { AppLayout } from './components/layout/AppLayout';
import Categorias from './features/cadastros/pages/Categorias';
import Produtos from './features/cadastros/pages/Produtos';
import Atributos from './features/cadastros/pages/Atributos';
import ImportacaoFiscal from './features/cadastros/pages/ImportacaoFiscal';
import LancamentosList from './features/financeiro/pages/LancamentosList';
import CategoriasFinanceiras from './features/financeiro/pages/CategoriasFinanceiras';

// Instância do React Query
const queryClient = new QueryClient();

// Provider Global de Tema
const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
};

// Guarda de Rotas Autenticadas (Acesso apenas logado)
const AuthGuard = () => {
  const { token, user } = useAuthStore();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

// Guarda de Rotas de App (Acesso apenas logado E com Filial Selecionada nesta aba)
const AppGuard = () => {
  const { token, user } = useAuthStore();
  const { activeFilial } = useEmpresaStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verifica se a sessionStorage possui a filial ativa desta janela/aba
  if (!activeFilial) {
    return <Navigate to="/hub" replace />;
  }

  return <Outlet />;
};


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Rotas que exigem Autenticação, mas não exigem Filial (ex: Hub) */}
          <Route element={<AuthGuard />}>
            <Route path="/hub" element={<Hub />} />

            {/* Rotas Administrativas "Minha Conta" */}
            <Route path="/minha-conta" element={<MinhaContaLayout />}>
              <Route index element={<Navigate to="unidades" replace />} />
              <Route path="unidades" element={<Unidades />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="perfis" element={<Perfis />} />
              <Route path="faturamento" element={<Faturamento />} />
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          {/* Rotas do Core da Aplicação que exigem Filial selecionada NAQUELA ABA */}
          <Route element={<AppGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/categorias" element={<Categorias />} />
              <Route path="/app/produtos" element={<Produtos />} />
              <Route path="/app/grade" element={<Atributos />} />
              <Route path="/app/fiscal" element={<ImportacaoFiscal />} />
              <Route path="/app/financeiro/lancamentos" element={<LancamentosList />} />
              <Route path="/app/financeiro/categorias" element={<CategoriasFinanceiras />} />
              <Route path="/app/configuracoes" element={<ConfiguracoesHub />} />
              <Route path="/app/perfil" element={<Navigate to="/app/configuracoes" replace />} />
              {/* Outras rotas como /app/pdv, /app/vendas virão aqui */}
            </Route>
          </Route>

        </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors theme={useThemeStore.getState().isDarkMode ? 'dark' : 'light'} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
