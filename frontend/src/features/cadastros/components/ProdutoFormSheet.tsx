import { useState, useEffect } from 'react';
import {
  X, Layers, FileText, CheckCircle2,
  DollarSign, Truck, Settings, Tag,
  Globe, Box, Plus, Trash2, Zap, Utensils,
  Video, MessageSquare, ShieldCheck, ShoppingCart, Link
} from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import type { SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { NumericFormat } from 'react-number-format';
import { useThemeStore } from '../../../store/themeStore';
import { useCategorias } from '../services/categorias';
import { FiscalAutocomplete } from './FiscalAutocomplete';
import { getUnidadeTributavel } from '../utils/fiscalRules';
import { useCreateProduto, useUpdateProduto, useProduto, useInsumos } from '../services/produtos';
import { useFornecedores } from '../services/pessoas';
import api from '../../../lib/api';

import { AtmCurrencyInput } from '../../../components/AtmCurrencyInput';


const produtoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  codigo: z.string().optional(),
  nome_tecnico: z.string().optional(),
  unidade_comercial_id: z.string().min(1, 'Selecione a unidade comercial'),
  unidade_tributaria_id: z.string().optional(),
  codigo_barras: z.string().optional(),
  peso_bruto: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  peso_liquido: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  fator_conversao: z.preprocess((val) => (val === '' || val === null ? 1 : Number(val)), z.number().optional().default(1)),
  fator_conversao_tributavel: z.preprocess((val) => (val === '' || val === null ? 1 : Number(val)), z.number().optional().default(1)),
  categoria_id: z.string().min(1, 'Selecione uma categoria'),
  tipo_produto: z.enum(['REVENDA', 'MATERIA_PRIMA', 'PRODUTO_ACABADO', 'SERVICO']),
  preco_venda: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(0).default(0)),
  preco_minimo: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  preco_custo: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  margem_lucro: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  ncm: z.string().optional().nullable()
    .refine(val => {
      if (!val || val.trim() === '') return true;
      return val.replace(/\D/g, '').length === 8;
    }, 'NCM deve ter 8 dígitos quando preenchido'),
  cest: z.string().optional().nullable(),
  origem_mercadoria: z.string().optional().default('0'),
  cfop_padrao: z.string().optional().nullable(),
  estoque_minimo: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  estoque_maximo: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  localizacao_fisica: z.string().optional().nullable(),
  altura: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  largura: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  comprimento: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  cross_docking_dias: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  descricao_detalhada: z.string().optional().nullable(),
  link_video_youtube: z.string().optional().nullable(),
  link_externo: z.string().optional().nullable(),
  fornecedor_padrao_id: z.string().optional().nullable(),
  codigo_referencia_fornecedor: z.string().optional().nullable(),
  garantia_meses: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().optional().nullable()),
  ativo: z.boolean().default(true),
  controla_grade: z.boolean().default(false),
  variacoes: z.array(z.object({
    id: z.string().optional(),
    atributos: z.record(z.string(), z.string()),
    sku: z.string().optional(),
    preco_venda: z.number().optional(),
    estoque_atual: z.number().default(0),
    ativo: z.boolean().default(true),
  })).optional(),
  ficha_tecnica: z.array(z.object({
    materia_prima_id: z.string(),
    quantidade_consumida: z.number().min(0.0001, 'Quantidade inválida'),
    unidade_medida: z.string().optional(),
  })).optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  produtoId?: string | null;
}

type TabType = 'DADOS' | 'VENDA' | 'GRADE' | 'PRODUCAO' | 'MARKETING' | 'OUTROS';

interface Unidade {
  id: string;
  sigla: string;
  nome: string;
}

interface AtributoCategoria {
  id: string;
  nome: string;
  valores_padrao: string[];
}

export function ProdutoFormSheet({ isOpen, onClose, produtoId }: Props) {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabType>('DADOS');
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const { data: categorias } = useCategorias();
  const [atributosCategoria, setAtributosCategoria] = useState<AtributoCategoria[]>([]);
  const [selectedAtributosValues, setSelectedAtributosValues] = useState<Record<string, string[]>>({});
  const [errorSubmit, setErrorSubmit] = useState('');

  const { mutateAsync: createProduto, isPending: isCreating } = useCreateProduto();
  const { mutateAsync: updateProduto, isPending: isUpdating } = useUpdateProduto(produtoId || null);
  const { data: produtoData } = useProduto(produtoId || null);
  const { data: insumos } = useInsumos();
  const { data: fornecedores } = useFornecedores();

  const isSaving = isCreating || isUpdating;

  const { control, handleSubmit, watch, getValues, reset, formState: { errors } } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema) as any,
    mode: 'onChange',
    defaultValues: {
      nome: '',
      codigo: '',
      nome_tecnico: '',
      unidade_comercial_id: '',
      unidade_tributaria_id: '',
      codigo_barras: '',
      peso_bruto: 0,
      peso_liquido: 0,
      fator_conversao: 1,
      fator_conversao_tributavel: 1,
      categoria_id: '',
      tipo_produto: 'REVENDA',
      preco_venda: 0,
      preco_minimo: 0,
      preco_custo: 0,
      margem_lucro: 0,
      ncm: '',
      cest: '',
      origem_mercadoria: '0',
      cfop_padrao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
      localizacao_fisica: '',
      altura: 0,
      largura: 0,
      comprimento: 0,
      cross_docking_dias: 0,
      descricao_detalhada: '',
      link_video_youtube: '',
      link_externo: '',
      fornecedor_padrao_id: '',
      codigo_referencia_fornecedor: '',
      garantia_meses: 0,
      ativo: true,
      controla_grade: false,
      variacoes: [],
      ficha_tecnica: []
    }
  });

  const { fields: fieldsVariacoes, replace: replaceVariacoes, remove: removeVariacao } = useFieldArray({
    control,
    name: 'variacoes'
  });

  const { fields: fieldsFicha, append: appendFicha, remove: removeFicha } = useFieldArray({
    control,
    name: 'ficha_tecnica'
  });

  const selectedCategoriaId = watch('categoria_id');
  const selectedNcm = watch('ncm');
  const selectedUnidadeId = watch('unidade_comercial_id');
  const tipoProduto = watch('tipo_produto');

  // Algoritmo de Produto Cartesiano
  const cartesian = (...args: any[][]) => {
    return args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
  };

  // Lógica Fiscal NT 2016.001
  const uTribRecomendada = getUnidadeTributavel(selectedNcm ?? undefined);
  const currentUnidade = unidades.find(u => u.id === selectedUnidadeId);
  const precisaConversao = uTribRecomendada && currentUnidade && uTribRecomendada !== currentUnidade.sigla;

  // Buscar unidades e gerenciar limpeza do formulário
  useEffect(() => {
    if (isOpen) {
      api.get('/api/v1/unidades').then(res => setUnidades(res.data)).catch(() => { });
    }
    if (!isOpen) {
      reset({
        nome: '',
        codigo: '',
        nome_tecnico: '',
        unidade_comercial_id: '',
        unidade_tributaria_id: '',
        codigo_barras: '',
        peso_bruto: 0,
        peso_liquido: 0,
        fator_conversao: 1,
        fator_conversao_tributavel: 1,
        categoria_id: '',
        tipo_produto: 'REVENDA',
        preco_venda: 0,
        preco_minimo: 0,
        preco_custo: 0,
        margem_lucro: 0,
        ncm: '',
        cest: '',
        origem_mercadoria: '0',
        cfop_padrao: '',
        estoque_minimo: 0,
        estoque_maximo: 0,
        localizacao_fisica: '',
        altura: 0,
        largura: 0,
        comprimento: 0,
        cross_docking_dias: 0,
        descricao_detalhada: '',
        link_video_youtube: '',
        link_externo: '',
        fornecedor_padrao_id: '',
        codigo_referencia_fornecedor: '',
        garantia_meses: 0,
        ativo: true,
        controla_grade: false,
        variacoes: [],
        ficha_tecnica: []
      });
      setActiveTab('DADOS');
    }
  }, [isOpen, reset]);

  // Carregar dados para edição (apenas uma vez por abertura/troca de produto)
  useEffect(() => {
    if (isOpen && produtoData && !isSaving) {
      reset({
        ...produtoData,
        tipo_produto: (produtoData.tipo_produto as any) || 'REVENDA',
        nome_tecnico: produtoData.nome_tecnico || '',
        codigo_barras: produtoData.codigo_barras || '',
        cest: produtoData.cest || '',
        cfop_padrao: produtoData.cfop_padrao || '',
        localizacao_fisica: produtoData.localizacao_fisica || '',
        descricao_detalhada: produtoData.descricao_detalhada || '',
        link_video_youtube: produtoData.link_video_youtube || '',
        link_externo: produtoData.link_externo || '',
        fornecedor_padrao_id: produtoData.fornecedor_padrao_id || '',
        codigo_referencia_fornecedor: produtoData.codigo_referencia_fornecedor || '',
        unidade_tributaria_id: produtoData.unidade_tributaria_id || '',
        unidade_comercial_id: produtoData.unidade_comercial_id || '',
        categoria_id: produtoData.categoria_id || '',
        ncm: produtoData.ncm || '',
        preco_venda: produtoData.preco_venda ?? 0,
        preco_minimo: produtoData.preco_minimo ?? undefined,
        preco_custo: produtoData.preco_custo ?? undefined,
        margem_lucro: produtoData.margem_lucro ?? undefined,
        fator_conversao: (produtoData as any).fator_conversao ?? 1,
        fator_conversao_tributavel: (produtoData as any).fator_conversao_tributavel ?? 1,
        estoque_minimo: (produtoData as any).estoque_minimo ?? undefined,
        estoque_maximo: (produtoData as any).estoque_maximo ?? undefined,
        altura: (produtoData as any).altura ?? undefined,
        largura: (produtoData as any).largura ?? undefined,
        comprimento: (produtoData as any).comprimento ?? undefined,
        peso_bruto: (produtoData as any).peso_bruto ?? undefined,
        peso_liquido: (produtoData as any).peso_liquido ?? undefined,
      } as any);
    }
  }, [isOpen, produtoId, !!produtoData]);

  useEffect(() => {
    if (selectedCategoriaId) {
      api.get(`/api/v1/atributos/por-categoria/${selectedCategoriaId}`)
        .then(res => {
          setAtributosCategoria(res.data);
          setSelectedAtributosValues({});
          replaceVariacoes([]);
        })
        .catch(() => {
          setAtributosCategoria([]);
          replaceVariacoes([]);
        });
    } else {
      setAtributosCategoria([]);
      replaceVariacoes([]);
    }
  }, [selectedCategoriaId, replaceVariacoes]);

  const toggleAtributoValue = (atId: string, value: string) => {
    setSelectedAtributosValues(prev => {
      const current = prev[atId] || [];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [atId]: next };
    });
  };

  const addEixoAtributo = (nome: string) => {
    const id = `extra_${Date.now()}`;
    setAtributosCategoria(prev => [...prev, { id, nome, valores_padrao: [] }]);
  };

  const gerarCombinacoes = () => {
    const keys = Object.keys(selectedAtributosValues).filter(k => selectedAtributosValues[k].length > 0);
    if (keys.length === 0) return;

    // Prepara os arrays para o produto cartesiano
    const arraysParaCombinar = keys.map(key =>
      selectedAtributosValues[key].map(val => ({ [key]: val }))
    );

    const combinacoesRaw = cartesian(...arraysParaCombinar);

    const combinacoes = (Array.isArray(combinacoesRaw[0]) ? combinacoesRaw : combinacoesRaw.map(c => [c])) as any[][];

    const formatadas = combinacoes.map(comb => {
      const atributos = comb.reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {});

      return {
        atributos,
        sku: '',
        preco_venda: getValues('preco_venda') || 0,
        estoque_atual: 0,
        ativo: true
      };
    });

    replaceVariacoes(formatadas);
  };

  const onSubmit: SubmitHandler<ProdutoFormData> = async (data) => {
    // Função defensiva para garantir que strings vazias sejam enviadas como NULL
    const recursiveNullify = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(recursiveNullify);
      if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = typeof value === 'string' && value.trim() === "" ? null : recursiveNullify(value);
        }
        return newObj;
      }
      return obj;
    };

    // Limpeza de payload para evitar erro de "Registro Duplicado" (id no corpo)
    const cleanData = { ...(data as any) };
    delete cleanData.id;
    delete cleanData.tenant_id;
    delete cleanData.filial_id;
    delete cleanData.created_at;
    delete cleanData.updated_at;
    delete cleanData.deleted_at;

    const payload = recursiveNullify({
      ...cleanData,
      fator_conversao_tributavel: precisaConversao ? data.fator_conversao_tributavel : 1.0,
      variacoes: data.controla_grade ? data.variacoes : [],
      ficha_tecnica: tipoProduto === 'PRODUTO_ACABADO' ? data.ficha_tecnica : []
    });

    try {
      setErrorSubmit('');
      console.log('Hyper-Produto Payload (Clean):', payload);

      if (produtoId) {
        await updateProduto(payload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await createProduto(payload);
        toast.success('Produto criado com sucesso!');
      }
      onClose();
    } catch (error: any) {
      const dbError = error.response?.data?.database_error || '';
      const detail = error.response?.data?.detail || error.message;
      
      console.error('Falha ao salvar produto:', {
        message: detail,
        database_error: dbError,
        full_error: error
      });

      setErrorSubmit(dbError ? `${detail} (${dbError})` : detail);
      toast.error(dbError || detail);
    }
  };

  const onError = (errors: FieldErrors<ProdutoFormData>) => {
    console.error('Erros de validação:', errors);

    // Mapeamento amigável de nomes de campos para o Toast
    const fieldNames: Record<string, string> = {
      nome: 'Nome do Produto',
      tipo_produto: 'Tipo de Produto',
      categoria_id: 'Categoria',
      unidade_comercial_id: 'Unidade Comercial',
      preco_venda: 'Preço de Venda',
      ncm: 'NCM (Fiscal)',
      'ficha_tecnica': 'Ficha Técnica'
    };

    const pendingFields = Object.keys(errors)
      .map(key => fieldNames[key] || key)
      .join(', ');

    toast.error('Pendências no formulário!', {
      description: `Por favor, revise os seguintes campos: ${pendingFields}.`,
      duration: 5000
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" onClick={onClose} />
      <div className={`fixed top-[112px] right-6 bottom-6 z-[90] w-full md:w-[1000px] shadow-2xl flex flex-col rounded-[32px] overflow-hidden border ${isDarkMode ? 'bg-[#111114] border-white/10' : 'bg-white border-slate-200'}`}>

        <div className={`flex items-center justify-between px-8 py-5 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
              <Box size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black">{produtoId ? 'Editar Produto' : 'Novo Produto'}</h2>
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">ERP Hyper-Master Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full opacity-50 hover:opacity-100 transition-opacity"><X size={20} /></button>
        </div>

        <div className={`flex items-center px-6 gap-6 border-b overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
          {[
            { id: 'DADOS', icon: Tag, label: 'Dados' },
            { id: 'VENDA', icon: DollarSign, label: 'Venda' },
            { id: 'GRADE', icon: Layers, label: 'Grade' },
            ...(tipoProduto === 'PRODUTO_ACABADO' ? [{ id: 'PRODUCAO', icon: Utensils, label: 'Produção' }] : []),
            { id: 'MARKETING', icon: Globe, label: 'MKT' },
            { id: 'OUTROS', icon: Settings, label: 'Outros' }
          ].map((tab) => {
            const fieldsByTab: Record<string, string[]> = {
              DADOS: ['nome', 'unidade_comercial_id', 'categoria_id', 'tipo_produto', 'peso_bruto', 'peso_liquido', 'estoque_minimo', 'estoque_maximo'],
              VENDA: ['preco_venda', 'ncm', 'cest', 'origem_mercadoria', 'cfop_padrao'],
              GRADE: ['variacoes'],
              PRODUCAO: ['ficha_tecnica'],
              MARKETING: ['link_video_youtube', 'link_externo', 'descricao_detalhada'],
              OUTROS: ['garantia_meses', 'localizacao_fisica']
            };
            const hasError = fieldsByTab[tab.id]?.some(field => errors[field as keyof typeof errors]);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-4 px-2 text-[11px] font-black border-b-2 transition-all relative ${activeTab === tab.id ? 'text-violet-500 border-violet-500' : 'text-slate-500 border-transparent hover:text-slate-400'}`}
              >
                <tab.icon size={14} strokeWidth={3} />
                {tab.label.toUpperCase()}
                {hasError && (
                  <span className="absolute top-3 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/50" />
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="flex-1 overflow-y-auto p-8 space-y-8">

          {errorSubmit && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-bold text-sm">
              Erro: {errorSubmit}
            </div>
          )}

          {activeTab === 'DADOS' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in zoom-in-95">
              <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Nome do Produto *</label>
                  <Controller name="nome" control={control} render={({ field }) => (
                    <input
                      {...field}
                      className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-white/5 border-transparent focus:border-violet-500 text-white' : 'bg-slate-50 border-transparent focus:border-violet-500 text-slate-900'}`}
                    />
                  )} />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Código</label>
                  <Controller name="codigo" control={control} render={({ field }) => (
                    <input
                      {...field}
                      readOnly
                      placeholder="Gerado automaticamente..."
                      className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none opacity-50 transition-all ${isDarkMode ? 'bg-white/5 border-transparent text-white' : 'bg-slate-50 border-transparent text-slate-900'}`}
                    />
                  )} />
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Tipo</label>
                <Controller name="tipo_produto" control={control} render={({ field }) => (
                  <select {...field} className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-white/5 border-transparent focus:border-violet-500 text-white' : 'bg-slate-50 border-transparent focus:border-violet-500 text-slate-900'}`}>
                    <option value="REVENDA">Revenda</option>
                    <option value="MATERIA_PRIMA">Matéria Prima</option>
                    <option value="PRODUTO_ACABADO">Produto Acabado</option>
                  </select>
                )} />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Categoria</label>
                <Controller name="categoria_id" control={control} render={({ field }) => (
                  <select
                    {...field}
                    value={field.value ?? ''}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-white/5 border-transparent focus:border-violet-500 text-white' : 'bg-slate-50 border-transparent focus:border-violet-500 text-slate-900'}`}
                  >
                    <option value="">Selecione...</option>
                    {categorias?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                )} />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Unidade Comercial *</label>
                <Controller
                  name="unidade_comercial_id"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value ?? ''}
                      className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-white/5 border-transparent focus:border-violet-500 text-white' : 'bg-slate-50 border-transparent focus:border-violet-500 text-slate-900'}`}
                    >
                      <option value="">Selecione...</option>
                      {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.sigla} - {u.nome}</option>)}
                    </select>
                  )}
                />
              </div>

              <div className="md:col-span-12 mt-8 pt-8 border-t border-dashed border-white/10">
                <h4 className="text-[10px] font-black uppercase mb-6 opacity-30 flex items-center gap-2 tracking-[0.3em]">
                  <Truck size={14} className="text-blue-500" /> DADOS LOGÍSTICOS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2 font-mono">Peso Bruto (Kg)</label>
                    <Controller name="peso_bruto" control={control} render={({ field }) => (
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={4}
                        value={field.value}
                        onValueChange={(values) => field.onChange(values.floatValue || 0)}
                        className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none ${isDarkMode ? 'bg-black/40 border-transparent focus:border-indigo-500 text-white' : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900 shadow-sm'}`}
                      />
                    )} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2 font-mono">Peso Líquido (Kg)</label>
                    <Controller name="peso_liquido" control={control} render={({ field }) => (
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={4}
                        value={field.value}
                        onValueChange={(values) => field.onChange(values.floatValue || 0)}
                        className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none ${isDarkMode ? 'bg-black/40 border-transparent focus:border-indigo-500 text-white' : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900 shadow-sm'}`}
                      />
                    )} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2 font-mono">Estoque Mínimo</label>
                    <Controller name="estoque_minimo" control={control} render={({ field }) => (
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={4}
                        value={field.value}
                        onValueChange={(values) => field.onChange(values.floatValue || 0)}
                        className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none ${isDarkMode ? 'bg-black/40 border-transparent focus:border-indigo-500 text-white' : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900 shadow-sm'}`}
                      />
                    )} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2 font-mono">Estoque Máximo</label>
                    <Controller name="estoque_maximo" control={control} render={({ field }) => (
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={4}
                        value={field.value}
                        onValueChange={(values) => field.onChange(values.floatValue || 0)}
                        className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none ${isDarkMode ? 'bg-black/40 border-transparent focus:border-indigo-500 text-white' : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900 shadow-sm'}`}
                      />
                    )} />
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 mt-8 pt-8 border-t border-dashed border-white/10">
                <h4 className="text-[10px] font-black uppercase mb-6 opacity-30 flex items-center gap-2 tracking-[0.3em]">
                  <ShoppingCart size={14} className="text-emerald-500" /> DADOS DE SUPRIMENTOS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2">Fornecedor Padrão</label>
                    <Controller name="fornecedor_padrao_id" control={control} render={({ field }) => (
                      <select {...field} value={field.value ?? ''} className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-black/40 border-transparent focus:border-emerald-500 text-white' : 'bg-white border-slate-200 focus:border-emerald-500 text-slate-900 shadow-sm'}`}>
                        <option value="">Selecione o fornecedor...</option>
                        {fornecedores?.map(fornecedor => (
                          <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
                        ))}
                      </select>
                    )} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2">Cód. Referência no Fornecedor</label>
                    <Controller name="codigo_referencia_fornecedor" control={control} render={({ field }) => (
                      <input {...field} value={field.value ?? ''} placeholder="Ex: REF-ABC-123" className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-black/40 border-transparent focus:border-emerald-500 text-white' : 'bg-white border-slate-200 focus:border-emerald-500 text-slate-900 shadow-sm'}`} />
                    )} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'GRADE' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className={`p-8 rounded-[40px] border-2 ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50/50 border-slate-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black italic">Matriz de Variações</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Motor Cartesian Hyper-Master</p>
                  </div>
                  <Controller
                    name="controla_grade"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] transition-all ${field.value ? 'bg-violet-600 text-white shadow-lg' : 'bg-black/5 opacity-50'}`}
                      >
                        <Zap size={14} className={field.value ? 'animate-pulse' : ''} />
                        {field.value ? 'GRADE ATIVA' : 'ATIVAR GRADE'}
                      </button>
                    )}
                  />
                </div>

                {watch('controla_grade') && (
                  <div className="space-y-8">
                    {/* GERADOR DE EIXOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {atributosCategoria.map(at => (
                        <div key={at.id} className={`p-6 rounded-3xl border-2 transition-all ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50">{at.nome}</h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-500">TAGS</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {at.valores_padrao.map((val: string, idx: number) => {
                              const isSelected = selectedAtributosValues[at.id]?.includes(val);
                              return (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => toggleAtributoValue(at.id, val)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border-2 ${isSelected ? 'bg-violet-600 border-violet-600 text-white shadow-md scale-105' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:border-slate-200'}`}
                                >
                                  {val.toUpperCase()}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const nome = prompt('Nome do novo eixo de atributo (ex: Tecido):');
                          if (nome) addEixoAtributo(nome);
                        }}
                        className={`flex items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed transition-all hover:border-violet-500/50 hover:bg-violet-500/5 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}
                      >
                        <Plus size={20} className="text-violet-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Novo Eixo</span>
                      </button>
                    </div>

                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={gerarCombinacoes}
                        className="px-12 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
                      >
                        <Zap size={16} fill="currentColor" /> GERAR GRADE CARTESIANA
                      </button>
                    </div>

                    {/* TABELA DE VARIANTES */}
                    {fieldsVariacoes.length > 0 && (
                      <div className={`overflow-hidden rounded-3xl border-2 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                        <table className="w-full text-left text-[11px]">
                          <thead className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <tr>
                              <th className="p-5 font-black uppercase opacity-40">Combinação</th>
                              <th className="p-5 font-black uppercase opacity-40">Código SKU</th>
                              <th className="p-5 font-black uppercase opacity-40 text-center">Preço (R$)</th>
                              <th className="p-5 font-black uppercase opacity-40 text-center">Estoque</th>
                              <th className="p-5"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {fieldsVariacoes.map((item, idx) => (
                              <tr key={item.id} className="group hover:bg-violet-500/[0.02] transition-colors">
                                <td className="p-5">
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(item.atributos).map(([k, v]) => (
                                      <span key={k} className="px-2.5 py-1 bg-violet-500/10 text-violet-500 rounded-lg font-black text-[10px]">
                                        {String(v).toUpperCase()}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-5">
                                  <Controller
                                    name={`variacoes.${idx}.sku`}
                                    control={control}
                                    render={({ field }) => (
                                      <input
                                        {...field}
                                        placeholder="Automático..."
                                        className="bg-transparent font-bold text-violet-500 outline-none w-full"
                                      />
                                    )}
                                  />
                                </td>
                                <td className="p-5">
                                  <Controller
                                    name={`variacoes.${idx}.preco_venda`}
                                    control={control}
                                    render={({ field }) => (
                                      <AtmCurrencyInput
                                        value={field.value || 0}
                                        onChange={(val) => field.onChange(val)}
                                        className="bg-transparent font-black text-center text-emerald-500 outline-none w-full"
                                      />
                                    )}
                                  />
                                </td>
                                <td className="p-5">
                                  <Controller
                                    name={`variacoes.${idx}.estoque_atual`}
                                    control={control}
                                    render={({ field }) => (
                                      <NumericFormat
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        decimalScale={4}
                                        value={field.value}
                                        onValueChange={(values) => field.onChange(values.floatValue || 0)}
                                        className="bg-transparent font-black text-center opacity-40 outline-none w-full"
                                      />
                                    )}
                                  />
                                </td>
                                <td className="p-5 text-right px-8">
                                  <button type="button" onClick={() => removeVariacao(idx)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'PRODUCAO' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className={`p-8 rounded-[40px] border-2 transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50/50 border-slate-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black italic">Ficha Técnica de Produção</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Engenharia de Produto & Insumos</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendFicha({ materia_prima_id: '', quantidade_consumida: 0 })}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={16} strokeWidth={3} /> ADICIONAR INSUMO
                  </button>
                </div>

                {fieldsFicha.length === 0 ? (
                  <div className="py-24 text-center opacity-20">
                    <Utensils size={64} strokeWidth={1} className="mx-auto mb-4" />
                    <p className="font-black text-xs uppercase tracking-widest">Nenhum componente na receita</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fieldsFicha.map((field, index) => {
                      const selectedId = watch(`ficha_tecnica.${index}.materia_prima_id`);
                      // Aqui derivamos a unidade do modelo de insumos carregados
                      const selectedInsumo = insumos?.find(i => i.id === selectedId);

                      return (
                        <div key={field.id} className={`group flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${isDarkMode ? 'bg-black/20 border-white/5 hover:border-indigo-500/30' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}>
                          <div className="flex-1">
                            <Controller
                              name={`ficha_tecnica.${index}.materia_prima_id`}
                              control={control}
                              render={({ field: selectField }) => (
                                <select
                                  {...selectField}
                                  className={`w-full bg-transparent font-bold text-sm outline-none appearance-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                >
                                  <option value="">Selecione o Insumo/Matéria-Prima...</option>
                                  {insumos?.map(insumo => (
                                    <option key={insumo.id} value={insumo.id}>
                                      {insumo.codigo ? `${insumo.codigo} - ` : ''}{insumo.nome}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>
                          <div className="w-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/5">
                            <Controller
                              name={`ficha_tecnica.${index}.quantidade_consumida`}
                              control={control}
                              render={({ field: qtyField }) => (
                                <NumericFormat
                                  thousandSeparator="."
                                  decimalSeparator=","
                                  decimalScale={4}
                                  value={qtyField.value}
                                  onValueChange={(values) => qtyField.onChange(values.floatValue || 0)}
                                  className="w-full bg-transparent text-center font-black text-xs outline-none"
                                  placeholder="0,0000"
                                />
                              )}
                            />
                            <span className="text-[10px] font-black opacity-30">
                              {selectedInsumo?.unidade_sigla || 'UN/KG'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFicha(index)}
                            className="p-2.5 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'VENDA' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Preço Venda (R$)</label>
                  <Controller name="preco_venda" control={control} render={({ field }) => (
                    <AtmCurrencyInput
                      value={field.value || 0}
                      onChange={(val) => field.onChange(val)}
                      className={`w-full px-4 py-3 rounded-xl border-2 font-black text-emerald-500 outline-none ${isDarkMode ? 'bg-white/5 border-transparent focus:border-emerald-500' : 'bg-slate-50 border-transparent'}`}
                    />
                  )} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Preço Mínimo (R$)</label>
                  <Controller name="preco_minimo" control={control} render={({ field }) => (
                    <AtmCurrencyInput
                      value={field.value || 0}
                      onChange={(val) => field.onChange(val)}
                      className={`w-full px-4 py-3 rounded-xl border-2 font-black text-rose-500 outline-none ${isDarkMode ? 'bg-white/5 border-transparent focus:border-rose-500' : 'bg-slate-50 border-transparent'}`}
                    />
                  )} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Último Custo (R$)</label>
                  <Controller name="preco_custo" control={control} render={({ field }) => (
                    <AtmCurrencyInput
                      value={field.value || 0}
                      onChange={(val) => field.onChange(val)}
                      className={`w-full px-4 py-3 rounded-xl border-2 font-black opacity-50 outline-none ${isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50 border-transparent'}`}
                    />
                  )} />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-dashed border-white/10 space-y-8">
                <h4 className="text-[10px] font-black uppercase mb-6 opacity-30 flex items-center gap-2 tracking-[0.3em]">
                  <FileText size={14} className="text-violet-500" /> DADOS FISCAIS (NF-E)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`p-6 rounded-[32px] border-2 ${isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50 border-transparent shadow-sm'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-50 flex items-center gap-2">
                      <FileText size={14} className="text-violet-500" /> CLASSIFICAÇÃO NCM / CEST
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <Controller
                          name="ncm"
                          control={control}
                          render={({ field }) => (<FiscalAutocomplete
                            label="NCM (8 dígitos) (opcional)"
                            tipo="ncm"
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="Pesquise por código ou descrição..."
                          />)}
                        />
                      </div>

                      {precisaConversao && (
                        <div className={`p-4 rounded-2xl border-2 flex gap-4 animate-in slide-in-from-top-2 duration-300 ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 flex-shrink-0 self-start">
                            <Settings size={18} />
                          </div>
                          <div className="space-y-3">
                            <p className="text-xs font-bold leading-relaxed">
                              A SEFAZ exige que produtos deste NCM sejam declarados em <span className="text-amber-500">{uTribRecomendada}</span>, mas você vende em <span className="text-amber-600 dark:text-amber-400">{currentUnidade?.sigla}</span>.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-black uppercase opacity-50 mb-1">Unid. Tributável</label>
                                <input readOnly value={uTribRecomendada || ''} className="w-full px-3 py-2 rounded-lg bg-black/5 border-transparent outline-none font-bold text-xs cursor-not-allowed opacity-70" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black uppercase opacity-50 mb-1 font-mono">Fator p/ {uTribRecomendada}</label>
                                <Controller name="fator_conversao_tributavel" control={control} render={({ field }) => (
                                  <NumericFormat
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    decimalScale={6}
                                    value={field.value}
                                    onValueChange={(values) => field.onChange(values.floatValue || 1)}
                                    placeholder="Ex: 0,5"
                                    className={`w-full px-3 py-2 rounded-lg bg-black/10 border-transparent outline-none font-bold text-xs ring-1 ring-amber-500/30 focus:ring-amber-500`}
                                  />
                                )} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <Controller
                          name="cest"
                          control={control}
                          render={({ field }) => (
                            <FiscalAutocomplete
                              label="CEST (7 dígitos)"
                              tipo="cest"
                              ncmFilter={selectedNcm ?? undefined}
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Ex: 2803800..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-[32px] border-2 ${isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50 border-transparent shadow-sm'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-50 flex items-center gap-2">
                      <Globe size={14} className="text-indigo-500" /> ORIGEM E OPERAÇÃO
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase mb-1 opacity-50">Origem da Mercadoria</label>
                        <Controller name="origem_mercadoria" control={control} render={({ field }) => (
                          <select {...field} className={`w-full px-4 py-3 rounded-xl border-2 font-bold outline-none ${isDarkMode ? 'bg-black/40 border-transparent focus:border-indigo-500 text-white' : 'bg-white border-slate-200'}`}>
                            <option value="0">0 - Nacional</option>
                            <option value="1">1 - Estrangeira (Importação Direta)</option>
                            <option value="2">2 - Estrangeira (Mercado Interno)</option>
                            <option value="3">3 - Nacional ({'>'}40% Conteúdo Imp.)</option>
                            <option value="4">4 - Nacional (Proc. Básico)</option>
                            <option value="5">5 - Nacional ({'<'}=40% Conteúdo Imp.)</option>
                          </select>
                        )} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase mb-1 opacity-50">CFOP Padrão de Venda</label>
                        <Controller name="cfop_padrao" control={control} render={({ field }) => (
                          <FiscalAutocomplete
                            label=""
                            tipo="cfop"
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="Ex: 5102..."
                          />
                        )} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'MARKETING' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className={`p-8 rounded-[40px] border-2 ${isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50 border-transparent shadow-sm'}`}>
                <h4 className="text-[10px] font-black uppercase mb-8 opacity-50 flex items-center gap-2 tracking-[0.2em]">
                  <Globe size={14} className="text-sky-500" /> CONTEÚDO PARA E-COMMERCE
                </h4>
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2">Link do Vídeo (YouTube)</label>
                    <div className="relative group">
                      <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 group-focus-within:scale-110 transition-transform" />
                      <Controller name="link_video_youtube" control={control} render={({ field }) => (
                        <input {...field} value={field.value ?? ''} placeholder="https://youtube.com/watch?v=..." className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-black/40 border-white/5 focus:border-red-500' : 'bg-white border-slate-200 focus:border-red-500 shadow-inner'}`} />
                      )} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px) font-black uppercase mb-2 opacity-50 px-2">Descrição Detalhada do Produto</label>
                    <div className="relative group">
                      <MessageSquare size={18} className="absolute left-4 top-6 text-indigo-500 group-focus-within:scale-110 transition-transform" />
                      <Controller name="descricao_detalhada" control={control} render={({ field }) => (
                        <textarea {...field} value={field.value ?? ''} rows={8} placeholder="Conte a história do produto, especificações técnicas, benefícios..." className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 font-bold outline-none transition-all resize-y min-h-[200px] ${isDarkMode ? 'bg-black/40 border-white/5 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500 shadow-inner'}`} />
                      )} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2">Site / Link Externo</label>
                    <div className="relative group">
                      <Link size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 group-focus-within:scale-110 transition-transform" />
                      <Controller name="link_externo" control={control} render={({ field }) => (
                        <input {...field} value={field.value ?? ''} placeholder="https://meusite.com/produto" className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-black/40 border-white/5 focus:border-sky-500' : 'bg-white border-slate-200 focus:border-sky-500 shadow-inner'}`} />
                      )} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'OUTROS' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className={`p-8 rounded-[40px] border-2 ${isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50 border-transparent shadow-sm'}`}>
                <h4 className="text-[10px] font-black uppercase mb-8 opacity-50 flex items-center gap-2 tracking-[0.2em]">
                  <ShieldCheck size={14} className="text-amber-500" /> GARANTIA E OBSERVAÇÕES
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-2 opacity-50 px-2">Tempo de Garantia (Meses)</label>
                    <div className="relative group">
                      <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 group-focus-within:scale-110 transition-transform" />
                      <Controller name="garantia_meses" control={control} render={({ field }) => (
                        <NumericFormat
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={0}
                          value={field.value}
                          onValueChange={(values) => field.onChange(values.floatValue || 0)}
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 font-bold outline-none transition-all ${isDarkMode ? 'bg-black/40 border-white/5 focus:border-amber-500' : 'bg-white border-slate-200 focus:border-amber-500 shadow-inner'}`}
                        />
                      )} />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase opacity-50 font-mono">MESES</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className={`px-8 py-6 border-t flex justify-end gap-3 ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <button type="button" onClick={onClose} disabled={isSaving} className="px-6 py-3 font-bold opacity-50 hover:opacity-100 disabled:opacity-30">Cancelar</button>
          <button disabled={isSaving} onClick={handleSubmit(onSubmit, onError)} className="px-10 py-3 rounded-xl bg-slate-900 text-white font-black text-sm shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0">
            {isSaving ? <Zap size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {isSaving ? 'SALVANDO...' : 'SALVAR PRODUTO'}
          </button>
        </div>
      </div>
    </>
  );
}
