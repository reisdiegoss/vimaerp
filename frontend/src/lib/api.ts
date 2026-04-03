import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.vimaerp.com.br',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // 1. Pega o token JWT do localStorage (via Zustand)
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Pega o filial_id ativo isoladamente do sessionStorage
    const activeFilialId = sessionStorage.getItem('active_filial_id');
    if (activeFilialId) {
      config.headers['X-Filial-Id'] = activeFilialId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirou ou inválido: Limpar authStore e redirecionar para Login
      console.warn("Sessão expirada. Redirecionando para login...");
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status === 422) {
      // Erro de Validação de Schema (Pydantic) - Útil para Debug
      console.error("Erro de Validação (422):", error.response.data?.detail);
    }
    return Promise.reject(error);
  }
);

export default api;
