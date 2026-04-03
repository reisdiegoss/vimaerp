import { useState } from 'react';
import { X, Building2, MapPin, Building, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';

interface FilialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FilialFormModal({ isOpen, onClose, onSuccess }: FilialFormModalProps) {
  const { isDarkMode } = useThemeStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    ie: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      await api.post('/api/v1/filiais', formData);
      queryClient.invalidateQueries({ queryKey: ['filiais'] });
      onSuccess();
    } catch (error: any) {
      setErrorStatus(error.response?.data?.detail || 'Erro ao cadastrar Unidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Base Class adaptativa para inputs
  const inputBaseClass = `w-full px-4 py-3 rounded-xl transition-all outline-none border ${
    isDarkMode 
      ? 'bg-[#111] border-white/10 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50' 
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30'
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
        isDarkMode ? 'bg-[#0f0f11] border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
              <Building2 size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Nova Unidade</h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gerar nova extensão de CNPJ (Filial).</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Form) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6">
          {errorStatus && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
              {errorStatus}
            </div>
          )}

          <div className="space-y-6">
            {/* Seção Principal */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <Building size={16} /> Identidade Fiscal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Razão Social / Nome de Fantasia *</label>
                  <input required name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Matriz São Paulo" className={inputBaseClass} />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>CNPJ</label>
                  <input name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" className={inputBaseClass} />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Inscrição Estadual (IE)</label>
                  <input name="ie" value={formData.ie} onChange={handleChange} placeholder="Isento ou Número" className={inputBaseClass} />
                </div>
              </div>
            </div>

            <div className={`h-px w-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Seção Endereço */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <MapPin size={16} /> Localidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Logradouro / Rua</label>
                  <input name="logradouro" value={formData.logradouro} onChange={handleChange} placeholder="Av Paulista" className={inputBaseClass} />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Número</label>
                  <input name="numero" value={formData.numero} onChange={handleChange} placeholder="1000" className={inputBaseClass} />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>CEP</label>
                  <input name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" className={inputBaseClass} />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bairro</label>
                  <input name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Centro" className={inputBaseClass} />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cidade</label>
                  <input name="cidade" value={formData.cidade} onChange={handleChange} placeholder="São Paulo" className={inputBaseClass} />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>UF</label>
                  <input name="uf" value={formData.uf} onChange={handleChange} placeholder="SP" maxLength={2} className={inputBaseClass} />
                </div>
              </div>
            </div>

          </div>

          <div className={`mt-8 pt-6 border-t flex justify-end gap-3 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
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
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Criando...</>
              ) : (
                <>Adicionar Unidade</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
