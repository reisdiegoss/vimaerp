import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface FilialInfo {
  id: string;
  nome: string;
  cnpj?: string | null;
  logo_path?: string | null;
  conectados?: number;
}

interface EmpresaState {
  activeFilial: FilialInfo | null;
  setActiveFilial: (filial: FilialInfo) => void;
  clearActiveFilial: () => void;
}

export const useEmpresaStore = create<EmpresaState>()(
  persist(
    (set) => ({
      activeFilial: null,

      setActiveFilial: (filial) => {
        // Salvamos também estritamente a chave em texto puro para facilitar
        // a extração super veloz pelo Axios Interceptor
        sessionStorage.setItem('active_filial_id', filial.id);
        set({ activeFilial: filial });
      },

      clearActiveFilial: () => {
        sessionStorage.removeItem('active_filial_id');
        set({ activeFilial: null });
      },
    }),
    {
      name: 'vimaerp-empresa-aba',
      // FUNDAMENTAL: Zustand salva neste storage (isolado por aba do navegador)
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
