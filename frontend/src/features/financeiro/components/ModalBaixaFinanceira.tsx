import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle2, Calendar as CalendarIcon, Wallet, ArrowRight } from 'lucide-react';
import { financeiroService } from '../api/financeiroService';
import type { LancamentoFinanceiro } from '../api/financeiroService';
import { useThemeStore } from '@/store/themeStore';
import { AtmCurrencyInput } from '@/components/AtmCurrencyInput';

const schema = z.object({
  data_pagamento: z.string().min(1, 'Data de pagamento é obrigatória'),
  valor_pago: z.number().min(0.01, 'O valor pago deve ser maior que zero'),
  conta_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lancamento: LancamentoFinanceiro | null;
}

export function ModalBaixaFinanceira({ isOpen, onClose, lancamento }: Props) {
  const { isDarkMode } = useThemeStore();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: contas } = useQuery({
    queryKey: ['contas-bancarias'],
    queryFn: () => financeiroService.getContasBancarias(),
    enabled: isOpen
  });

  const baixaMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!lancamento) throw new Error('Lançamento não selecionado');
      // Converte valor para centavos antes de enviar
      const payload = {
        ...data,
        valor_pago: Math.round(data.valor_pago * 100)
      };
      return financeiroService.pagarLancamento(lancamento.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      onClose();
    }
  });

  useEffect(() => {
    if (isOpen && lancamento) {
      reset({
        data_pagamento: new Date().toISOString().split('T')[0],
        valor_pago: lancamento.valor / 100, // Converte centavos para decimal para o input
        conta_id: lancamento.conta_id,
      });
    }
  }, [isOpen, lancamento, reset]);

  if (!isOpen || !lancamento) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const onSubmit = (data: FormData) => {
    baixaMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${
        isDarkMode ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 text-emerald-500">
            <CheckCircle2 size={24} />
            <h2 className="text-xl font-black">Baixa Financeira</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          {/* Info do Lançamento */}
          <div className={`mb-8 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Liquidando Lançamento</p>
            <h4 className="font-bold text-gray-900 dark:text-white">{lancamento.descricao}</h4>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
               <div>
                  <span className="text-[10px] font-black uppercase opacity-50 block">Valor Original</span>
                  <span className="font-bold">{formatCurrency(lancamento.valor)}</span>
               </div>
               <ArrowRight className="text-gray-300" size={20} />
               <div className="text-right">
                  <span className="text-[10px] font-black uppercase opacity-50 block">Status Atual</span>
                  <span className="text-amber-500 font-bold uppercase text-xs">{lancamento.atrasado ? 'VENCIDO' : 'PENDENTE'}</span>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Data e Valor Pago */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50 flex items-center gap-2">
                  <CalendarIcon size={12} /> Data Pagamento
                </label>
                <input
                  {...register('data_pagamento')}
                  type="date"
                  className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold ${
                    isDarkMode ? 'bg-black border-transparent focus:border-emerald-500 text-white' : 'bg-slate-50 border-transparent focus:border-emerald-500'
                  } ${errors.data_pagamento ? 'border-rose-500' : ''}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Valor Pago (R$)</label>
                <Controller
                  name="valor_pago"
                  control={control}
                  render={({ field }) => (
                    <AtmCurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold ${
                        isDarkMode ? 'bg-black border-transparent focus:border-emerald-500 text-white' : 'bg-slate-50 border-transparent focus:border-emerald-500'
                      } ${errors.valor_pago ? 'border-rose-500' : ''}`}
                    />
                  )}
                />
              </div>
            </div>

            {/* Conta Bancária Destino */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50 flex items-center gap-2">
                <Wallet size={12} /> Conta de Destino
              </label>
              <select
                {...register('conta_id')}
                className={`w-full px-5 py-3 rounded-2xl border-2 outline-none transition-all font-bold appearance-none ${
                  isDarkMode ? 'bg-black border-transparent focus:border-emerald-500 text-white' : 'bg-slate-50 border-transparent focus:border-emerald-500'
                }`}
              >
                {contas?.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
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
              disabled={baixaMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs text-white transition-all shadow-xl hover:-translate-y-1 active:scale-95 bg-emerald-600 shadow-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> CONFIRMAR BAIXA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
