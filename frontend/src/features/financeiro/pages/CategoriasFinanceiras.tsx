import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit3, Tag, Layers } from 'lucide-react';
import { financeiroService, TipoLancamento } from '../api/financeiroService';

export default function CategoriasFinanceiras() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Categorias
  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: () => financeiroService.getCategorias(),
  });

  const filteredCategorias = categorias?.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Layers className="text-indigo-600" size={32} /> Plano de Contas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie as categorias de receitas e despesas do seu negócio.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95">
          <Plus size={20} /> Nova Categoria
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-4">
          {isLoading ? (
             Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800 animate-pulse rounded-lg"></div>
            ))
          ) : filteredCategorias && filteredCategorias.length > 0 ? (
            filteredCategorias.map((cat) => (
              <div 
                key={cat.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${cat.tipo === TipoLancamento.RECEITA ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                    <Tag size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{cat.nome}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      {cat.tipo}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 italic">
              Nenhuma categoria encontrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
