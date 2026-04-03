import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface SortableGroupProps {
  id: string;
  title: string;
  children: React.ReactNode;
  colorClass: string;
  cardIds: string[]; // Necessário para o SortableContext interno
  isEditing?: boolean;
}

export function SortableGroup({ id, title, children, colorClass, cardIds, isEditing = false }: SortableGroupProps) {
  const { isDarkMode } = useThemeStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    data: {
      type: 'group',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="col-span-full mb-6 group/groupHeader">
      <div className={`flex items-center gap-4 border-b pb-2 mb-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
        {/* Alça de arraste do grupo - visivel APENAS no modo edição */}
        {isEditing && (
          <div 
            {...attributes} 
            {...listeners}
            className={`p-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
              isDarkMode ? 'bg-white/5 text-slate-300 hover:text-cyan-400' : 'bg-slate-200 text-slate-600 hover:text-violet-600'
            }`}
          >
            <GripHorizontal size={20} />
          </div>
        )}
        
        <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${colorClass}`}>
          {title}
        </h2>
      </div>

      <SortableContext items={cardIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {children}
        </div>
      </SortableContext>
    </div>
  );
}
