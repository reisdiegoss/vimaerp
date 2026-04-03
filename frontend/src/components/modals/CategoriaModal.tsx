import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateCategoria, useUpdateCategoria } from '../../features/cadastros/services/categorias';
import { useThemeStore } from '../../store/themeStore';
import { X, Save } from 'lucide-react';
import api from '../../lib/api';

const schema = z.object({
  nome: z.string().min(2, 'O nome da categoria deve ter no mínimo 2 caracteres'),
  ativo: z.boolean(),
  atributos_ids: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categoriaParaEditar?: { id: string; nome: string; ativo: boolean; atributos_ids?: string[] } | null;
}

export function CategoriaModal({ isOpen, onClose, categoriaParaEditar }: Props) {
  const { isDarkMode } = useThemeStore();
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const [atributos, setAtributos] = useState<any[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      ativo: true,
      atributos_ids: [],
    }
  });

  const selecionados = watch('atributos_ids') || [];

  useEffect(() => {
    if (isOpen) {
      api.get('/api/v1/atributos').then(res => setAtributos(res.data)).catch(() => {});
    }

    if (categoriaParaEditar) {
      reset({
        nome: categoriaParaEditar.nome,
        ativo: categoriaParaEditar.ativo,
        atributos_ids: categoriaParaEditar.atributos_ids || [],
      });
    } else {
      reset({ nome: '', ativo: true, atributos_ids: [] });
    }
  }, [categoriaParaEditar, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        atributos_ids: data.atributos_ids || []
      };
      if (categoriaParaEditar) {
        await updateMutation.mutateAsync({ id: categoriaParaEditar.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Ocorreu um erro ao tentar salvar a categoria.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${
        isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex items-center justify-between px-8 py-5 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <h2 className="text-xl font-black">{categoriaParaEditar ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="space-y-6">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nome da Categoria *</label>
              <input
                {...register('nome')}
                type="text"
                className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold ${
                  isDarkMode 
                    ? 'bg-black border-transparent focus:border-violet-500 text-white' 
                    : 'bg-slate-50 border-transparent focus:border-violet-500 text-slate-900'
                } ${errors.nome ? 'border-red-500' : ''}`}
                placeholder="Ex: Roupas Femininas"
              />
              {errors.nome && <span className="text-red-500 text-[10px] font-black mt-2 block uppercase">{errors.nome.message}</span>}
            </div>

            <div className={`flex items-center justify-between p-5 rounded-2xl border-2 ${isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
              <div>
                <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>ATIVO</p>
                <p className={`text-[10px] font-medium opacity-50 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Permitir uso em novos produtos.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('ativo')} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
              </label>
            </div>

            {/* Configuração de Grade */}
            <div className="space-y-4">
              <label className={`block text-[10px] font-black uppercase tracking-widest opacity-50 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Variantes da Grade (Atributos)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {atributos.map(at => (
                  <button
                    key={at.id}
                    type="button"
                    onClick={() => {
                      const novo = selecionados.includes(at.id) 
                        ? selecionados.filter((id: string) => id !== at.id)
                        : [...selecionados, at.id];
                      setValue('atributos_ids', novo);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all font-black text-[10px] tracking-tight ${
                      selecionados.includes(at.id)
                        ? 'border-violet-500 bg-violet-500/10 text-violet-500 shadow-lg shadow-violet-500/10'
                        : isDarkMode ? 'border-transparent bg-white/5 text-slate-500' : 'border-transparent bg-slate-100 text-slate-500'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selecionados.includes(at.id) ? 'bg-violet-500 animate-pulse' : 'bg-slate-400'}`} />
                    {at.nome.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs text-white transition-all shadow-xl hover:-translate-y-1 active:scale-95 ${
                isDarkMode ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/20' : 'bg-slate-900 shadow-slate-900/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Save size={18} strokeWidth={2.5} />
               SALVAR CATEGORIA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
