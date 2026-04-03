import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, 
  CheckCircle2, Tag, ChevronLeft 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../../store/themeStore';
import api from '../../../lib/api';

interface AtributoRead {
  id: string;
  nome: string;
  slug: string;
  valores_padrao: string[];
  categoria_nomes?: string[];
  categoria_ids?: string[];
}

export default function Atributos() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAtributo, setEditingAtributo] = useState<AtributoRead | null>(null);
  const [formData, setFormData] = useState({ nome: '', valores: '', categoria_ids: [] as string[] });

  // Busca de Categorias para o cruzamento
  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const res = await api.get('/api/v1/categorias');
      return res.data;
    }
  });

  const { data: atributos, isLoading } = useQuery({
    queryKey: ['atributos'],
    queryFn: async () => {
      const res = await api.get('/api/v1/atributos');
      return res.data as AtributoRead[];
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingAtributo) {
        return api.put(`/api/v1/atributos/${editingAtributo.id}`, data);
      }
      return api.post('/api/v1/atributos', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
      // toast.success(editingAtributo ? 'Atributo atualizado' : 'Atributo criado');
      closeModal();
    },
    onError: () => alert('Erro ao salvar atributo')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/atributos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
    }
  });

  const openModal = (at?: AtributoRead) => {
    if (at) {
      setEditingAtributo(at);
      setFormData({ 
        nome: at.nome, 
        valores: at.valores_padrao.join(', '),
        categoria_ids: at.categoria_ids || []
      });
    } else {
      setEditingAtributo(null);
      setFormData({ nome: '', valores: '', categoria_ids: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAtributo(null);
    setFormData({ nome: '', valores: '', categoria_ids: [] });
  };

  const toggleCategoria = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categoria_ids: prev.categoria_ids.includes(id)
        ? prev.categoria_ids.filter(cid => cid !== id)
        : [...prev.categoria_ids, id]
    }));
  };

  const handleSave = () => {
    // Converte a string "P, M, G" em Array ["P", "M", "G"] limpo
    const valoresArray = formData.valores
      ? formData.valores.split(',').map(v => v.trim()).filter(v => v !== '')
      : [];

    const payload = {
      nome: formData.nome,
      valores_padrao: valoresArray, // Nome exato esperado pelo Backend Pydantic
      categoria_ids: formData.categoria_ids
    };

    mutation.mutate(payload);
  };

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Breadcrumbs Discreto */}
      <nav className={`flex items-center gap-2 text-xs font-bold mb-4 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <Link to="/app/dashboard" className="hover:text-violet-500 transition-colors">Home</Link>
        <span>/</span>
        <span className="opacity-60">Cadastros</span>
        <span>/</span>
        <span className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>Atributos</span>
      </nav>

      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
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
            <h1 className="text-3xl font-black tracking-tight">Grade & Atributos</h1>
            <p className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Motor de Variantes Master
            </p>
          </div>
        </div>

        <button 
          onClick={() => openModal()}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white transition-all shadow-2xl hover:-translate-y-1 active:scale-95 ${
            isDarkMode ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/20' : 'bg-slate-900 shadow-slate-900/20'
          }`}
        >
          <Plus size={20} strokeWidth={3} />
          CRIAR NOVO ATRIBUTO
        </button>
      </div>

      {/* Grid de Atributos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className={`h-48 rounded-3xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />)
        ) : atributos?.map(at => (
          <div key={at.id} className={`group p-6 rounded-[32px] border transition-all hover:shadow-2xl flex flex-col justify-between ${
            isDarkMode ? 'bg-[#111114] border-white/5 hover:border-violet-500/30' : 'bg-white border-slate-100 hover:border-violet-200'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                 <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                    ID: {at.slug}
                 </div>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(at)} className="p-2 rounded-xl hover:bg-violet-500/10 text-violet-400 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(at.id)} className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>
              <h3 className="text-xl font-black mb-3">{at.nome}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {at.valores_padrao.map((val, idx) => (
                  <span key={idx} className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                    {val}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              {at.categoria_nomes && at.categoria_nomes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {at.categoria_nomes.map((cat, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase">
                      {cat}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Atributo Global
                </div>
              )}

              <div className={`pt-4 border-t flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'border-white/5 text-slate-600' : 'border-slate-50 text-slate-400'}`}>
                <Tag size={12} />
                DISPONÍVEL PARA GRADE
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeModal} />
          <div className={`relative w-full max-w-md p-8 rounded-[40px] shadow-2xl border animate-in zoom-in-95 duration-300 ${
            isDarkMode ? 'bg-[#111114] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-2xl font-black mb-6">{editingAtributo ? 'Editar Atributo' : 'Novo Atributo'}</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Nome do Atributo (ex: Cor)</label>
                <input 
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Tamanho"
                  className={`w-full px-5 py-4 rounded-2xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-white/5 border-transparent focus:border-violet-500' : 'bg-slate-50 border-transparent focus:border-violet-500'}`} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Vincular a Categorias (Opcional - Vazio = Global)</label>
                <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 rounded-2xl border-2 custom-scrollbar ${isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50 border-transparent'}`}>
                  {categorias?.map((cat: any) => (
                    <button 
                      key={cat.id}
                      onClick={() => toggleCategoria(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl transition-all text-left ${
                        formData.categoria_ids.includes(cat.id)
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                          : isDarkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 ${formData.categoria_ids.includes(cat.id) ? 'border-white bg-white' : 'border-slate-500'}`} />
                      <span className="text-[10px] font-bold truncate">{cat.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Valores Padrão (separados por vírgula)</label>
                <textarea 
                  rows={3}
                  value={formData.valores}
                  onChange={e => setFormData({ ...formData, valores: e.target.value })}
                  placeholder="P, M, G, GG..."
                  className={`w-full px-5 py-4 rounded-2xl border-2 font-bold outline-none transition-all resize-none ${isDarkMode ? 'bg-white/5 border-transparent focus:border-violet-500' : 'bg-slate-50 border-transparent focus:border-violet-500'}`} 
                />
                <p className="mt-2 text-[10px] font-bold text-slate-500 leading-relaxed italic">
                  * Estes valores sugeridos aparecerão automaticamente ao vincular produtos.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={closeModal}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all ${isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  CANCELAR
                </button>
                <button 
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  className={`flex-1 py-4 rounded-2xl font-black text-white transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 ${
                    isDarkMode ? 'bg-violet-600 shadow-violet-500/20' : 'bg-slate-900 shadow-slate-900/20'
                  }`}
                >
                  <CheckCircle2 size={18} />
                  SALVAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
