import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, ArrowUpCircle, ArrowDownCircle, Calendar as CalendarIcon, Tag, Wallet } from 'lucide-react';
import { financeiroService } from '../api/financeiroService';
import type { TipoLancamentoType } from '../api/financeiroService';
import { useThemeStore } from '@/store/themeStore';
import { AtmCurrencyInput } from '@/components/AtmCurrencyInput';

const schema = z.object({
  descricao: z.string().min(3, 'A descrição deve ter no mínimo 3 caracteres'),
  valor: z.number().min(1, 'O valor deve ser maior que zero'),
  tipo: z.enum(['RECEITA', 'DESPESA'] as const),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  categoria_id: z.string().min(1, 'Selecione uma categoria'),
  conta_id: z.string().min(1, 'Selecione uma conta bancária'),
  documento: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipoPadrao?: TipoLancamentoType;
}

export function ModalNovoLancamento({ isOpen, onClose, tipoPadrao = 'DESPESA' }: Props) {
  const { isDarkMode } = useThemeStore();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: tipoPadrao,
      valor: 0,
      data_vencimento: new Date().toISOString().split('T')[0],
    }
  });

  const tipoSelecionado = watch('tipo');

  // Carregar dados para selects
  const { data: categorias } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: () => financeiroService.getCategorias(),
    enabled: isOpen
  });

  const { data: contas } = useQuery({
    queryKey: ['contas-bancarias'],
    queryFn: () => financeiroService.getContasBancarias(),
    enabled: isOpen
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => financeiroService.createLancamento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      onClose();
      reset();
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        tipo: tipoPadrao,
        valor: 0,
        data_vencimento: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, tipoPadrao, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      valor: Math.round(data.valor * 100), // Converte para centavos
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className={`relative w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${
        isDarkMode ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${tipoSelecionado === 'RECEITA' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {tipoSelecionado === 'RECEITA' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
            </div>
            <h2 className="text-xl font-black">Novo Lançamento</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tipo Selector */}
            <div className="md:col-span-2 flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
              <button
                type="button"
                onClick={() => setValue('tipo', 'RECEITA')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${
                  tipoSelecionado === 'RECEITA' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                RECEITA
              </button>
              <button
                type="button"
                onClick={() => setValue('tipo', 'DESPESA')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${
                  tipoSelecionado === 'DESPESA' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                DESPESA
              </button>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Descrição *</label>
              <input
                {...register('descricao')}
                type="text"
                placeholder="Ex: Aluguel mensal, Venda de Produto..."
                className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold ${
                  isDarkMode ? 'bg-black border-transparent focus:border-indigo-500 text-white' : 'bg-slate-50 border-transparent focus:border-indigo-500'
                } ${errors.descricao ? 'border-rose-500' : ''}`}
              />
              {errors.descricao && <p className="text-rose-500 text-[10px] font-black mt-1 uppercase">{errors.descricao.message}</p>}
            </div>

            {/* Valor e Vencimento */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Valor (R$) *</label>
              <Controller
                name="valor"
                control={control}
                render={({ field }) => (
                  <AtmCurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold ${
                      isDarkMode ? 'bg-black border-transparent focus:border-indigo-500 text-white' : 'bg-slate-50 border-transparent focus:border-indigo-500'
                    } ${errors.valor ? 'border-rose-500' : ''}`}
                  />
                )}
              />
              {errors.valor && <p className="text-rose-500 text-[10px] font-black mt-1 uppercase">{errors.valor.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50 flex items-center gap-2">
                <CalendarIcon size={12} /> Vencimento *
              </label>
              <input
                {...register('data_vencimento')}
                type="date"
                className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold ${
                  isDarkMode ? 'bg-black border-transparent focus:border-indigo-500 text-white' : 'bg-slate-50 border-transparent focus:border-indigo-500'
                } ${errors.data_vencimento ? 'border-rose-500' : ''}`}
              />
            </div>

            {/* Categoria e Conta */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50 flex items-center gap-2">
                <Tag size={12} /> Categoria *
              </label>
              <select
                {...register('categoria_id')}
                className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold appearance-none ${
                  isDarkMode ? 'bg-black border-transparent focus:border-indigo-500 text-white' : 'bg-slate-50 border-transparent focus:border-indigo-500'
                } ${errors.categoria_id ? 'border-rose-500' : ''}`}
              >
                <option value="">Selecione...</option>
                {categorias?.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50 flex items-center gap-2">
                <Wallet size={12} /> Conta Bancária *
              </label>
              <select
                {...register('conta_id')}
                className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold appearance-none ${
                  isDarkMode ? 'bg-black border-transparent focus:border-indigo-500 text-white' : 'bg-slate-50 border-transparent focus:border-indigo-500'
                } ${errors.conta_id ? 'border-rose-500' : ''}`}
              >
                <option value="">Selecione...</option>
                {contas?.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Documento */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Nº Documento / Referência</label>
              <input
                {...register('documento')}
                type="text"
                placeholder="Ex: NF-123, Boleto..."
                className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold ${
                  isDarkMode ? 'bg-black border-transparent focus:border-indigo-500 text-white' : 'bg-slate-50 border-transparent focus:border-indigo-500'
                }`}
              />
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
              disabled={createMutation.isPending}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs text-white transition-all shadow-xl hover:-translate-y-1 active:scale-95 ${
                isDarkMode ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-900 shadow-slate-900/20'
              } disabled:opacity-50`}
            >
              <Save size={18} /> SALVAR LANÇAMENTO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
