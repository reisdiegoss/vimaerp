import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ModuleCard } from './ModuleCard';
import { GripVertical } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface SortableModuleCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  isEditing?: boolean;
}

export function SortableModuleCard(props: SortableModuleCardProps) {
  const { isDarkMode } = useThemeStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: props.id,
    data: {
      type: 'card',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group h-full">
      {/* Alça de arraste (Drag Handle) - visível APENAS no modo de edição */}
      {props.isEditing && (
        <div 
          {...attributes} 
          {...listeners}
          className={`absolute top-4 right-4 z-50 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-opacity ${
            isDarkMode ? 'bg-white/5 text-slate-300 hover:text-cyan-400' : 'bg-slate-200 text-slate-500 hover:text-violet-600'
          }`}
        >
          <GripVertical size={18} />
        </div>
      )}

      {/* Bloqueia cliques no Modulo enquanto Edita e da um efeito visual (ring) */}
      <div className={props.isEditing ? 'pointer-events-none opacity-80 ring-2 ring-cyan-500/10 rounded-2xl transition-all scale-[0.98] h-full' : 'transition-all h-full'}>
        <ModuleCard {...props} />
      </div>
    </div>
  );
}
