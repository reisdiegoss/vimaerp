import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, PackageOpen, Layers, ChevronLeft } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';
import { ProdutoFormSheet } from '../components/ProdutoFormSheet';
import { useProdutos } from '../services/produtos';

export default function Produtos() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<string | null>(null);

  const { data: produtos, isLoading } = useProdutos();

  const handleEdit = (id: string) => {
    setProdutoParaEditar(id);
    setIsSheetOpen(true);
  };

  const handleOpenNew = () => {
    setProdutoParaEditar(null);
    setIsSheetOpen(true);
  };

  // Helper para crachar badge por tipo
  const getBadgePorTipo = (tipo: string) => {
    switch (tipo) {
      case 'MATERIA_PRIMA':
        return isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PRODUTO_ACABADO':
        return isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SERVICO':
        return isDarkMode ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200';
      default: // REVENDA
        return isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };
  
  const getLabelTipo = (tipo: string) => {
    switch (tipo) {
      case 'MATERIA_PRIMA': return 'M. Prima';
      case 'PRODUTO_ACABADO': return 'Produzido';
      case 'SERVICO': return 'Serviço';
      default: return 'Revenda';
    }
  };

  // Filtro local otimista de pesquisa
  const filteredProdutos = produtos?.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Breadcrumbs Discreto */}
      <nav className={`flex items-center gap-2 text-xs font-bold mb-4 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <Link to="/app/dashboard" className="hover:text-violet-500 transition-colors">Home</Link>
        <span>/</span>
        <span className="opacity-60">Cadastros</span>
        <span>/</span>
        <span className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>Produtos</span>
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
            <h1 className="text-3xl font-black tracking-tight mb-0.5">Gestão de Produtos</h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
              Gerencie mercadorias, produções e fichas técnicas centralizadas.
            </p>
          </div>
        </div>

        <button 
          onClick={handleOpenNew}
          className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-violet-500/25 hover:shadow-cyan-500/40' 
              : 'bg-slate-900 text-white shadow-sm hover:shadow-md hover:bg-slate-800'
          }`}>
            <Plus size={18} strokeWidth={3} /> Novo Produto
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-lg mb-8 group animate-in fade-in duration-700 delay-200">
        <div className={`absolute inset-0 rounded-full blur transition-all duration-300 group-hover:blur-md ${
          isDarkMode ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30' : 'bg-slate-200'
        }`}></div>
        <div className="relative flex items-center">
          <Search className={`absolute left-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3.5 rounded-full outline-none transition-all border text-sm font-medium ${
              isDarkMode 
                ? 'bg-[#111] border-white/10 focus:border-violet-500 text-white placeholder-slate-500' 
                : 'bg-white border-slate-200 focus:border-violet-500 shadow-sm text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Data Table Container */}
      <div className={`rounded-2xl border overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 ${
        isDarkMode ? 'bg-white/5 border-white/10 shadow-black/50' : 'bg-white shadow-sm border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase border-b font-black ${
              isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="px-6 py-5 tracking-wider w-24">Código</th>
                <th className="px-6 py-5 tracking-wider">Produto</th>
                <th className="px-6 py-5 tracking-wider">Tipo/Natureza</th>
                <th className="px-6 py-5 tracking-wider text-right">Preço Venda</th>
                <th className="px-6 py-5 tracking-wider text-center">Status</th>
                <th className="px-6 py-5 tracking-wider text-right w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10">
                    <div className="flex flex-col gap-4 animate-pulse">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-14 w-full rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredProdutos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <PackageOpen size={56} className="mb-4" strokeWidth={1.5} />
                      <p className="text-xl font-bold">Nenhum produto cadastrado.</p>
                      <p className="text-sm mt-2 max-w-sm">
                        Inicie criando um novo produto para disponibilizar no PDV ou controlar o estoque.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProdutos.map((p: any) => (
                  <tr key={p.id} className={`transition-colors group ${
                    isDarkMode ? 'hover:bg-white/5 border-white/10' : 'hover:bg-slate-50 border-slate-100'
                  }`}>
                    <td className={`px-6 py-5 font-bold text-xs tracking-wider ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                      {p.codigo || '---'}
                    </td>
                    
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-white/5 text-violet-400' : 'bg-slate-100 text-violet-600'}`}>
                          <Layers size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm leading-tight mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{p.nome}</span>
                          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {p.categoria_id ? `Cat ID: ${p.categoria_id}` : 'Sem Categoria'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${getBadgePorTipo(p.tipo_produto)}`}>
                        {getLabelTipo(p.tipo_produto)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco_venda || 0)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        p.ativo
                          ? (isDarkMode ? 'border-emerald-500/30 text-emerald-400' : 'border-emerald-200 text-emerald-600')
                          : (isDarkMode ? 'border-red-500/30 text-red-500' : 'border-red-200 text-red-600')
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.ativo ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        {p.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(p.id)} className={`p-2 rounded-lg transition-all ${
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

      <ProdutoFormSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        produtoId={produtoParaEditar} 
      />
    </div>
  );
}
