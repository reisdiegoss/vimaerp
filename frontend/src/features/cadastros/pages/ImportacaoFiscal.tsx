import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle2, ChevronRight, AlertCircle, Database, Layout, ChevronLeft } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';
import axios from 'axios';

type Step = 'UPLOAD' | 'MAPPING' | 'PROCESS';

export default function ImportacaoFiscal() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [step, setStep] = useState<Step>('UPLOAD');
  const [tipo, setTipo] = useState<'NCM' | 'CEST' | 'CFOP'>('NCM');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ codigo: '', descricao: '', ncm: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Simular leitura de cabeçalhos (idealmente o backend enviaria, mas faremos local se for CSV ou via API simples)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Clonar o arquivo para memória evita net::ERR_UPLOAD_FILE_CHANGED se o Office salvar em background
    const buffer = await selectedFile.arrayBuffer();
    const safeFile = new File([buffer], selectedFile.name, { type: selectedFile.type });

    setFile(safeFile);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', safeFile);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/fiscal/colunas`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.colunas && response.data.colunas.length > 0) {
        setHeaders(response.data.colunas);
        setStep('MAPPING');
      } else {
        setError("Nenhuma coluna detectada no arquivo.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Falha ao processar as colunas do arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async () => {
    if (!file || !mapping.codigo || !mapping.descricao) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const params = {
      tipo,
      mapeamento: JSON.stringify(mapping)
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/fiscal/importar`, formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      setStep('PROCESS');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ocorreu um erro na importação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Breadcrumbs Discreto */}
      <nav className={`flex items-center gap-2 text-xs font-bold mb-4 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <Link to="/app/dashboard" className="hover:text-violet-500 transition-colors">Home</Link>
        <span>/</span>
        <span className="opacity-60">Cadastros</span>
        <span>/</span>
        <span className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>Fiscal</span>
      </nav>

      {/* Header Profissional */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-8 mb-8 gap-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app/dashboard')}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className={`text-3xl font-black tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Motor Fiscal
            </h1>
            <p className={`mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Mapeamento e Importação Inteligente (NCM, CEST, CFOP)
            </p>
          </div>
        </div>
        
        {/* Progress Tracker Horizontal */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-2 rounded-2xl border border-slate-200 dark:border-white/10">
          <div className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold ${step === 'UPLOAD' ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center">1</span> UPLOAD
          </div>
          <ChevronRight size={14} className="text-slate-300" />
          <div className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold ${step === 'MAPPING' ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center">2</span> MAPEAMENTO
          </div>
          <ChevronRight size={14} className="text-slate-300" />
          <div className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold ${step === 'PROCESS' ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center">3</span> RESULTADO
          </div>
        </div>
      </div>

      {step === 'UPLOAD' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 duration-300">
           {['NCM', 'CEST', 'CFOP'].map((t) => (
             <button
               key={t}
               onClick={() => setTipo(t as any)}
               className={`p-6 rounded-3xl border-2 transition-all text-left group ${
                tipo === t 
                  ? 'border-cyan-500 bg-cyan-500/5 shadow-xl shadow-cyan-500/10' 
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
               }`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${tipo === t ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                  <Database size={24} />
                </div>
                <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t}</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Tabela oficial do Governo (Federal/Fazenda)</p>
             </button>
           ))}

           <div className="col-span-full mt-8">
              <label className={`block w-full h-64 rounded-[2.5rem] border-4 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-4 group ${
                isDarkMode ? 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-cyan-300'
              }`}>
                <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                <div className="w-16 h-16 rounded-3xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:rotate-12 transition-transform">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Importar novo arquivo {tipo}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">Suporta XLSX, XLS e CSV (Ilimitados registros)</p>
                </div>
              </label>
           </div>
        </div>
      )}

      {step === 'MAPPING' && (
        <div className={`rounded-[2.5rem] p-10 border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-500">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Mapeamento de Colunas</h2>
              <p className="text-slate-500 font-medium">Arquivo: <span className="text-cyan-500 font-bold">{file?.name}</span></p>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Coluna do Código ({tipo})</label>
                  <select 
                    value={mapping.codigo}
                    onChange={(e) => setMapping(m => ({ ...m, codigo: e.target.value }))}
                    className="w-full bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="">Selecione a coluna...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Coluna da Descrição</label>
                  <select 
                    value={mapping.descricao}
                    onChange={(e) => setMapping(m => ({ ...m, descricao: e.target.value }))}
                    className="w-full bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="">Selecione a coluna...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                {tipo === 'CEST' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Coluna do NCM Vinculado</label>
                    <select 
                      value={mapping.ncm || ''}
                      onChange={(e) => setMapping(m => ({ ...m, ncm: e.target.value }))}
                      className="w-full bg-white dark:bg-[#1a1a1c] border border-cyan-500/20 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="">(Opcional) Selecione a coluna NCM...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-emerald-500 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
               <CheckCircle2 size={20} />
               <p className="text-sm font-bold tracking-tight">O sistema irá ignorar caracteres especiais (. - /) automaticamente nos códigos.</p>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
               <button onClick={() => setStep('UPLOAD')} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors uppercase tracking-widest text-xs">Voltar</button>
               <button 
                disabled={loading || !mapping.codigo || !mapping.descricao}
                onClick={executeImport}
                className="px-10 py-3 rounded-2xl bg-cyan-500 text-white font-black hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 uppercase tracking-widest text-xs"
               >
                 {loading ? "Processando..." : "Iniciar Importação"}
               </button>
            </div>
          </div>
        </div>
      )}

      {step === 'PROCESS' && result && (
        <div className={`rounded-[2.5rem] p-10 border shadow-2xl text-center animate-in zoom-in-95 duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
           <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
             <CheckCircle2 size={40} />
           </div>
           <h2 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Importação Concluída!</h2>
           <p className={`font-medium mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Os dados de {tipo} foram atualizados no seu motor de compliance.</p>

           <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                <p className="text-3xl font-black text-emerald-500">{result.novos}</p>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mt-1">Genuínos (Novos)</p>
              </div>
              <div className={`p-6 rounded-3xl border ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{result.atualizados}</p>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">Atualizados</p>
              </div>
              <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
                <p className="text-3xl font-black text-red-500">{result.erros}</p>
                <p className="text-xs font-black uppercase tracking-widest text-red-600 mt-1">Erros de Linha</p>
              </div>
           </div>

           <button 
            onClick={() => setStep('UPLOAD')}
            className={`mt-12 px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
              isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-900 hover:bg-black text-white'
            }`}
           >
             Nova Importação
           </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 font-bold animate-in shake duration-300">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="h-20 w-full"></div>
    </div>
  );
}
