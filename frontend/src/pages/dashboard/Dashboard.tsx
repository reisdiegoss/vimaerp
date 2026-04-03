import { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, Tags, Users, Building2, Wrench, 
  Receipt, FileText, BarChart3, Settings, Save, Layout 
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

import { useAuthStore } from '../../store/authStore';
import { useEmpresaStore } from '../../store/empresaStore';
import { useThemeStore } from '../../store/themeStore';
import { SortableGroup } from '../../components/dashboard/SortableGroup';
import { SortableModuleCard } from '../../components/dashboard/SortableModuleCard';
import axios from 'axios';

// Definição dos Módulos Disponíveis
const ALL_MODULES = [
  { id: 'pdv', title: "Frente de Caixa (PDV)", description: "Realize vendas rápidas, emita CF-e e gerencie seu caixa.", icon: <ShoppingCart />, href: "/app/pdv" },
  { id: 'produtos', title: "Produtos", description: "Catálogo completo, variações e regras de precificação.", icon: <Package />, href: "/app/produtos" },
  { id: 'estoque', title: "Estoque e Lotes", description: "Acompanhe entradas, saídas e prazos de validade.", icon: <Tags />, href: "/app/estoque" },
  { id: 'categorias', title: "Categorias", description: "Estruture e organize seus produtos por setores.", icon: <Package />, href: "/app/categorias" },
  { id: 'clientes', title: "Clientes", description: "Gestão da base, funil e histórico de vendas.", icon: <Users />, href: "/app/clientes" },
  { id: 'fornecedores', title: "Fornecedores", description: "Central de fornecedores e prestadores de serviço.", icon: <Building2 />, href: "/app/fornecedores" },
  { id: 'os', title: "Ordens de Serviço", description: "Módulo de OS: controle de manutenções e chamados.", icon: <Wrench />, href: "/app/os" },
  { id: 'caixa', title: "Cobranças e Caixa", description: "Contas a pagar e receber e tesouraria plena.", icon: <Receipt />, href: "/app/financeiro" },
  { id: 'notas', title: "Central de Notas", description: "Emissão autônoma e trânsito de NF-e, NFC-e.", icon: <FileText />, href: "/app/fiscal" },
  { id: 'relatorios', title: "Relatórios e DRE", description: "Dashboards interativos e resumos mensais.", icon: <BarChart3 />, href: "/app/relatorios" },
  { id: 'config', title: "Unidade de Negócio", description: "Certificados, limites e regras da filial.", icon: <Settings />, href: "/app/configuracoes" },
];

const DEFAULT_LAYOUT = [
  { id: 'grp_operacional', title: 'Operacional & PDV', colorClass: 'text-violet-400', cards: ['pdv', 'produtos', 'estoque', 'categorias'] },
  { id: 'grp_crm', title: 'Relacionamento (CRM)', colorClass: 'text-cyan-400', cards: ['clientes', 'fornecedores', 'os'] },
  { id: 'grp_financeiro', title: 'Financeiro & Fiscal', colorClass: 'text-emerald-400', cards: ['caixa', 'notas', 'relatorios'] },
  { id: 'grp_admin', title: 'Administração Local', colorClass: 'text-fuchsia-400', cards: ['config'] },
];

export default function Dashboard() {
  const { activeFilial } = useEmpresaStore();
  const { isDarkMode } = useThemeStore();
  const { user, token, updateLayout } = useAuthStore();
  
  const [layout, setLayout] = useState<any[]>(DEFAULT_LAYOUT);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Sensores DnD com suporte a Toque (Mobile-First)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (user?.dashboard_layout && activeFilial) {
      if (typeof user.dashboard_layout === 'object' && !Array.isArray(user.dashboard_layout)) {
        // Layout multi-filial mapeado
        const filialLayout = user.dashboard_layout[activeFilial.id];
        if (filialLayout && Array.isArray(filialLayout)) {
          setLayout(filialLayout);
        } else {
          setLayout(DEFAULT_LAYOUT);
        }
      } else {
        // Se for o formato antigo (Array), ignoramos para forçar a separação por unidade
        setLayout(DEFAULT_LAYOUT);
      }
    } else {
      setLayout(DEFAULT_LAYOUT);
    }
  }, [user, activeFilial]);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isEditingMode) return;

    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'group' && overType === 'group' && active.id !== over.id) {
      const oldIndex = layout.findIndex((item) => item.id === active.id);
      const newIndex = layout.findIndex((item) => item.id === over.id);
      
      const newLayout = arrayMove(layout, oldIndex, newIndex);
      setLayout(newLayout);
      return;
    }

    if (activeType === 'card' && active.id !== over.id) {
      const activeGroupIndex = layout.findIndex(g => g.cards.includes(active.id as string));
      if (activeGroupIndex === -1) return;

      const group = layout[activeGroupIndex];
      
      if (group.cards.includes(over.id as string)) {
        const oldCardIndex = group.cards.indexOf(active.id as string);
        const newCardIndex = group.cards.indexOf(over.id as string);
        
        const newCards = arrayMove(group.cards, oldCardIndex, newCardIndex);
        const newLayout = [...layout];
        newLayout[activeGroupIndex] = { ...group, cards: newCards };
        
        setLayout(newLayout);
      }
    }
  };

  const enterEditMode = () => {
    setIsEditingMode(true);
  };

  const cancelEditMode = () => {
    setIsEditingMode(false);
    if (user?.dashboard_layout && activeFilial) {
      if (Array.isArray(user.dashboard_layout)) {
         setLayout(user.dashboard_layout);
      } else if (typeof user.dashboard_layout === 'object') {
         setLayout(user.dashboard_layout[activeFilial.id] || DEFAULT_LAYOUT);
      }
    } else {
      setLayout(DEFAULT_LAYOUT);
    }
  };

  const saveLayout = async () => {
    if (!activeFilial) return;

    // Preserva o layout das outras filiais e adiciona/sobrescreve o da atual
    let currentLayoutDict: any = {};
    if (user?.dashboard_layout && !Array.isArray(user.dashboard_layout)) {
       currentLayoutDict = { ...user.dashboard_layout };
    }

    const payload = {
      ...currentLayoutDict,
      [activeFilial.id]: layout
    };

    setIsSaving(true);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/auth/layout`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sincroniza o LocalStorage (Zustand) com as mudanças recém salvas (já no formato dicionário)
      updateLayout(payload);
      setIsEditingMode(false);
    } catch (error) {
      console.error("Erro ao salvar layout:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Centralizado */}
      <div className="flex flex-col items-center text-center mb-12 mt-4 relative">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 border ${
          isDarkMode ? 'bg-white/5 border-white/10 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-600'
        }`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
          </span>
          Unidade Conectada
        </div>
        
        <h2 className={`text-4xl sm:text-5xl font-black tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Controle sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">Operação</span>
        </h2>
        
        <p className={`text-lg max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
           Bem-vindo à unidade <strong>{activeFilial?.nome}</strong>. Organize seu dashboard como preferir.
        </p>

        {/* Action Bar (Top) */}
        <div className="flex gap-4 items-center justify-center mt-8">
          {!isEditingMode ? (
            <button 
              onClick={enterEditMode}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all border ${
                isDarkMode ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20' : 'bg-white border-violet-200 text-violet-700 hover:bg-violet-50 hover:shadow-md'
              }`}
            >
              <Layout size={16} /> Organizar Dashboard
            </button>
          ) : (
            <div className={`flex items-center gap-3 p-1.5 rounded-full border shadow-xl ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200/60'}`}>
              <button 
                onClick={cancelEditMode}
                disabled={isSaving}
                className={`px-5 py-2 rounded-full font-bold transition-all text-sm ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button 
                onClick={saveLayout}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all text-white shadow-lg shadow-cyan-500/25 ${
                  isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50'
                }`}
              >
                {isSaving ? <span className="animate-spin text-white">⏳</span> : <Save size={16} />}
                {isSaving ? "Salvando..." : "Salvar Mudanças"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Area de Drag and Drop de Grupos e Cards */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
        modifiers={[restrictToFirstScrollableAncestor]}
      >
        <SortableContext items={layout.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {layout.map((group) => (
              <SortableGroup 
                key={group.id} 
                id={group.id} 
                title={group.title} 
                colorClass={isDarkMode ? group.colorClass : group.colorClass.replace('text-', 'text-').replace('-400', '-600')}
                cardIds={group.cards}
                isEditing={isEditingMode}
              >
                {group.cards.map((cardId: string) => {
                  const card = ALL_MODULES.find(m => m.id === cardId);
                  if (!card) return null;
                  return (
                    <SortableModuleCard
                      key={card.id}
                      id={card.id}
                      title={card.title}
                      description={card.description}
                      icon={card.icon}
                      href={card.href}
                      isEditing={isEditingMode}
                    />
                  );
                })}
              </SortableGroup>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Instrução Visual para o Usuário - Mostrar só no modo de edição */}
      {isEditingMode && (
        <div className={`mt-12 p-6 rounded-3xl border text-center animate-in fade-in duration-500 ${isDarkMode ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
            <Layout size={16} /> Toque e arraste os botões de alça nas pontas dos quadros
          </div>
        </div>
      )}

      <div className="h-20 w-full"></div>
    </div>
  );
}
