import { useState, useEffect } from 'react';
import { X, CheckCircle2, Copy, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';
import { integracaoService } from '../../../services/integracaoService';
import type { IntegracaoStatus } from '../../../services/integracaoService';

interface AsaasConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AsaasConfigModal({ isOpen, onClose }: AsaasConfigModalProps) {
  const { isDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<IntegracaoStatus | null>(null);
  const [apiKey, setApiKey] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await integracaoService.getAsaasStatus();
      setStatus(data);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar status da integração');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleActivate = async () => {
    if (!apiKey) {
      alert('Insira sua API Key do Asaas');
      return;
    }

    try {
      setSaving(true);
      await integracaoService.ativarAsaas(apiKey);
      alert('Integração ativada com sucesso!');
      fetchStatus();
    } catch (error) {
      console.error(error);
      alert('Erro ao ativar integração. Verifique a chave.');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl border overflow-hidden ${
        isDarkMode ? 'bg-[#121214] border-white/10' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header */}
        <div className={`p-8 border-b flex justify-between items-start ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <CreditCardIcon />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Integração Asaas</h2>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Automatize seu fluxo financeiro com a melhor API de pagamentos.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-sm">Consultando integração...</p>
            </div>
          ) : status?.is_integrated ? (
            /* ESTADO 2: INTEGRAÇÃO ATIVA */
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              
              {/* Banner de Sucesso */}
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={32} />
                <div>
                  <h4 className="font-black text-lg">Integração Ativa</h4>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">Seu VimaERP está conversando com o Asaas</p>
                </div>
              </div>

              {/* URL e Token do Webhook */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">URL do Webhook</label>
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border font-mono text-sm group ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="flex-1 truncate opacity-70">{status.details?.webhook_url}</span>
                    <button 
                      onClick={() => copyToClipboard(status.details?.webhook_url || '', 'URL')}
                      className="p-2 hover:bg-cyan-500/20 text-cyan-500 rounded-xl transition-all"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Token de Segurança (Asaas Access Token)</label>
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border font-mono text-sm group ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <ShieldCheck className="text-emerald-500" size={18} />
                    <span className="flex-1 truncate font-bold text-emerald-500">{status.details?.webhook_token}</span>
                    <button 
                      onClick={() => copyToClipboard(status.details?.webhook_token || '', 'Token')}
                      className="p-2 hover:bg-cyan-500/20 text-cyan-500 rounded-xl transition-all"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Instruções Finais */}
              <div className={`p-6 rounded-3xl border-l-4 border-amber-500 ${isDarkMode ? 'bg-amber-500/5 text-amber-200/80 border-amber-500/20' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                <div className="flex gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-medium leading-relaxed">
                    Copie estas duas informações e cole na aba <strong>Webhooks</strong> do painel do Asaas. Marque todos os eventos de cobrança para automação total.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <a href="https://www.asaas.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-cyan-500 transition-colors">
                  Painel Asaas <ExternalLink size={14} />
                </a>
                <button 
                  onClick={() => setStatus({ is_integrated: false })}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  Alterar API Key
                </button>
              </div>
            </div>
          ) : (
            /* ESTADO 1: FORMULÁRIO DE ATIVAÇÃO */
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <label className="block text-sm font-black mb-3">API Key do Asaas</label>
                <input 
                  type="password"
                  placeholder="Paste your $asaas_api_key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={`w-full p-4 rounded-2xl border font-mono text-sm outline-none transition-all ${
                    isDarkMode ? 'bg-black border-white/10 focus:border-cyan-500' : 'bg-white border-slate-200 focus:border-cyan-500'
                  }`}
                />
                <p className={`text-xs mt-4 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Encontre sua chave em: <strong>Minha Conta {'>'} Integrações {'>'} Gerar API Key</strong> no painel do Asaas.
                </p>
              </div>

              <button 
                onClick={handleActivate}
                disabled={saving}
                className={`w-full py-5 rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-emerald-500/20' 
                    : 'bg-slate-900 text-white shadow-slate-200'
                }`}
              >
                {saving ? 'Ativando...' : 'Ativar Integração'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreditCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
}
