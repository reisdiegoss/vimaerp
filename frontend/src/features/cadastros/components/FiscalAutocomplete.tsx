import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Check } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';
import api from '../../../lib/api';

interface FiscalItem {
  codigo: string;
  descricao: string;
}

interface FiscalAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tipo: 'ncm' | 'cest' | 'cfop';
  placeholder?: string;
  error?: string;
  ncmFilter?: string;
}

export function FiscalAutocomplete({ label, value, onChange, tipo, placeholder, error, ncmFilter }: FiscalAutocompleteProps) {
  const { isDarkMode } = useThemeStore();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<FiscalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = async (q: string, forceFetch = false) => {
    if (!forceFetch && q.length < 2 && !ncmFilter) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params: any = {};
      if (q.length >= 2) params.q = q;
      if (tipo === 'cest' && ncmFilter) params.ncm = ncmFilter;
      
      const response = await api.get(`/api/v1/fiscal/${tipo}/search`, { params });
      setResults(response.data);
      setOpen(true);
    } catch (err) {
      console.error(`Erro ao buscar ${tipo}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: FiscalItem) => {
    onChange(item.codigo);
    setQuery(item.codigo);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-[10px] font-black uppercase mb-1 opacity-50">{label}</label>
      
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val); // Permite free-typing manual do usuario
            search(val);
          }}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            } else if (tipo === 'cest' && ncmFilter && ncmFilter.length >= 4) {
              search(query, true); // Busca passivamentes os CESTs sugeridos para este NCM
            }
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-10 rounded-xl border-2 font-bold outline-none transition-all ${
            isDarkMode 
              ? 'bg-black/40 border-transparent focus:border-violet-500 text-white' 
              : 'bg-white border-slate-200 focus:border-violet-500 text-slate-800'
          } ${error ? 'border-red-500' : ''}`}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-violet-500" />
          ) : query ? (
            <button 
              onClick={() => { setQuery(''); onChange(''); setResults([]); }}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <Search size={16} className="text-slate-400" />
          )}
        </div>
      </div>

      {open && (
        <div className={`absolute z-[100] mt-2 w-full max-h-64 overflow-y-auto rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
          isDarkMode ? 'bg-[#1a1a1c] border-white/10' : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}>
          {results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.codigo}
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 transition-colors border-b last:border-0 ${
                  isDarkMode 
                    ? 'border-white/5 hover:bg-white/5' 
                    : 'border-slate-100 hover:bg-slate-50'
                } ${value === item.codigo ? (isDarkMode ? 'bg-violet-500/10' : 'bg-violet-50') : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                    {item.codigo}
                  </span>
                  {value === item.codigo && <Check size={14} className="text-emerald-500" />}
                </div>
                <span className={`text-[11px] font-medium leading-tight line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.descricao}
                </span>
              </button>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className={`text-sm font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {`Nenhum ${tipo.toUpperCase()} encontrado.`}
              </p>
              <p className={`text-[11px] font-bold mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {tipo === 'cest' && ncmFilter 
                  ? "Não encontrado CEST para o NCM informado." 
                  : "Verifique o código ou a descrição."}
                <br />Você pode continuar digitando manualmente.
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{error}</p>}
    </div>
  );
}
