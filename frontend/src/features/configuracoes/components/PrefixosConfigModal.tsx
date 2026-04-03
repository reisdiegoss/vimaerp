import { useState, useEffect } from 'react';
import { X, Save, FileText, Loader2, AlertTriangle, Building2, Tag, ShoppingCart, Users, Wrench } from 'lucide-react';
import { useEmpresaStore } from '../../../store/empresaStore';
import { filialService, type FilialUpdateDTO } from '../../../services/filialService';
import { useThemeStore } from '../../../store/themeStore';

interface PrefixosConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrefixosConfigModal({ isOpen, onClose }: PrefixosConfigModalProps) {
  const { isDarkMode } = useThemeStore();
  const { activeFilial } = useEmpresaStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<FilialUpdateDTO>({
    prefixo_categoria: '',
    prefixo_produto: '',
    prefixo_pessoa: '',
    prefixo_venda: '',
    prefixo_os: ''
  });

  useEffect(() => {
    if (isOpen && activeFilial) {
      carregarPrefixos();
    }
  }, [isOpen, activeFilial]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarPrefixos = async () => {
    if (!activeFilial) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const data = await filialService.getFilial(activeFilial.id);
      setFormData({
        prefixo_categoria: data.prefixo_categoria || '',
        prefixo_produto: data.prefixo_produto || '',
        prefixo_pessoa: data.prefixo_pessoa || '',
        prefixo_venda: data.prefixo_venda || '',
        prefixo_os: data.prefixo_os || ''
      });
    } catch (err: unknown) {
      const errorStr = err as any;
      setError(errorStr?.response?.data?.detail || 'Erro ao carregar configurações da unidade.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFilial) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await filialService.updateFilial(activeFilial.id, formData);
      setSuccessMessage('Prefixos atualizados com sucesso! Os próximos documentos gerados adotarão as novas siglas.');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const errorStr = err as any;
      setError(errorStr?.response?.data?.detail || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Força MAIÚSCULO e remove espaços
    const formatado = value.toUpperCase().replace(/\s/g, '').substring(0, 5);
    setFormData(prev => ({ ...prev, [name]: formatado }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 scale-in-center ${
        isDarkMode ? 'bg-[#1e1e20] border border-slate-800' : 'bg-white border border-slate-200'
      }`}>
        
        {/* Cabeçalho */}
        <div className={`p-6 sm:p-8 border-b ${
          isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Prefixos e Documentos</h2>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Customização por Unidade (Filial Atual: {activeFilial?.nome})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 border ${
              isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className={`p-4 rounded-xl flex items-start gap-3 border ${
              isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">✓</div>
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Carregando configurações...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Prefixo p/ Clientes
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text"
                    name="prefixo_pessoa"
                    value={formData.prefixo_pessoa || ''}
                    onChange={handleChange}
                    placeholder="Padrão: CLI"
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all border ${
                      isDarkMode
                        ? 'bg-[#151517] border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Prefixo p/ Produtos
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Tag className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text"
                    name="prefixo_produto"
                    value={formData.prefixo_produto || ''}
                    onChange={handleChange}
                    placeholder="Padrão: PRO"
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all border ${
                      isDarkMode
                        ? 'bg-[#151517] border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Prefixo p/ Vendas
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShoppingCart className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text"
                    name="prefixo_venda"
                    value={formData.prefixo_venda || ''}
                    onChange={handleChange}
                    placeholder="Padrão: VEN"
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all border ${
                      isDarkMode
                        ? 'bg-[#151517] border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Prefixo p/ O.S.
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Wrench className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text"
                    name="prefixo_os"
                    value={formData.prefixo_os || ''}
                    onChange={handleChange}
                    placeholder="Padrão: OS"
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all border ${
                      isDarkMode
                        ? 'bg-[#151517] border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
              
              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Prefixo p/ Categorias
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text"
                    name="prefixo_categoria"
                    value={formData.prefixo_categoria || ''}
                    onChange={handleChange}
                    placeholder="Padrão: CAT"
                    className={`block w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all border ${
                      isDarkMode
                        ? 'bg-[#151517] border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Rodapé Actions */}
          <div className={`mt-8 pt-6 flex items-center justify-end gap-3 border-t ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
