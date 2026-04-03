import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, FolderMinus, Tag, ChevronLeft } from 'lucide-react';
import { useCategorias } from '../services/categorias';
import { useThemeStore } from '../../../store/themeStore';
import { CategoriaModal } from '../../../components/modals/CategoriaModal';

export default function Categorias() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<any>(null);

  const { data: categorias, isLoading } = useCategorias();

  // Filtragem local
  const filteredCategorias = categorias?.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (cat: any) => {
    setCategoriaParaEditar(cat);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setCategoriaParaEditar(null);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Breadcrumbs Discreto */}
      <nav className={`flex items-center gap-2 text-xs font-bold mb-4 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <Link to="/app/dashboard" className="hover:text-violet-500 transition-colors">Home</Link>
        <span>/</span>
        <span className="opacity-60">Cadastros</span>
        <span>/</span>
        <span className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>Categorias</span>
      </nav>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
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
            <h1 className="text-3xl font-black tracking-tight mb-0.5">Categorias de Produto</h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
              Estruture e organize seus produtos por setores ou departamentos.
            </p>
          </div>
        </div>

        <button 
          onClick={handleOpenNew}
          className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-violet-500/25 hover:shadow-cyan-500/40' 
              : 'bg-slate-900 text-white shadow-sm hover:shadow-md hover:bg-slate-800'
          }`}>
            <Plus size={18} strokeWidth={3} /> Nova Categoria
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md mb-8 group animate-in fade-in duration-700 delay-200">
        <div className={`absolute inset-0 rounded-full blur transition-all duration-300 group-hover:blur-md ${
          isDarkMode ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30' : 'bg-slate-200'
        }`}></div>
        <div className="relative flex items-center">
          <Search className={`absolute left-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-full outline-none transition-all border text-sm font-medium ${
              isDarkMode 
                ? 'bg-[#111] border-white/10 focus:border-violet-500 text-white placeholder-slate-500' 
                : 'bg-white border-slate-200 focus:border-violet-500 shadow-sm text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className={`rounded-2xl border overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 ${
        isDarkMode ? 'bg-white/5 border-white/10 shadow-black/50' : 'bg-white shadow-sm border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase border-b font-black ${
              isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="px-6 py-5 tracking-wider w-32">Código</th>
                <th className="px-6 py-5 tracking-wider">Nome da Categoria</th>
                <th className="px-6 py-5 tracking-wider">Status</th>
                <th className="px-6 py-5 tracking-wider text-right w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10">
                    {/* Skelleton */}
                    <div className="flex flex-col gap-4 animate-pulse">
                      {[1,2,3].map(i => (
                        <div key={i} className={`h-12 w-full rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredCategorias.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <FolderMinus size={48} className="mb-4" />
                      <p className="text-lg font-bold">Nenhuma categoria encontrada.</p>
                      <p className="text-sm mt-1">Clique em "Nova Categoria" para começar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategorias.map((c) => (
                  <tr key={c.id} className={`transition-colors group ${
                    isDarkMode ? 'hover:bg-white/5 border-white/10' : 'hover:bg-slate-50 border-slate-100'
                  }`}>
                    <td className={`px-6 py-5 font-bold text-xs tracking-wider ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                      {c.codigo || '---'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                          <Tag size={16} className={isDarkMode ? 'text-violet-400' : 'text-violet-600'} />
                        </div>
                        <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                        c.ativo
                          ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                          : (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200')
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${c.ativo ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        {c.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(c)} className={`p-2 rounded-lg transition-all ${
                          isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                        }`}>
                          <Edit2 size={16} />
                        </button>
                        <button className={`p-2 rounded-lg transition-all ${
                          isDarkMode ? 'hover:bg-red-500/20 text-red-500 hover:text-red-400' : 'hover:bg-red-100 text-red-500 hover:text-red-700'
                        }`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoriaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categoriaParaEditar={categoriaParaEditar} 
      />
    </div>
  );
}
