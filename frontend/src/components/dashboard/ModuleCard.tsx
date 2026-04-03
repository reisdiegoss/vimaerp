import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
}

export function ModuleCard({ title, description, icon, href }: ModuleCardProps) {
  const { isDarkMode } = useThemeStore();

  return (
    <Link 
      to={href} 
      className={`block h-full group relative overflow-hidden rounded-3xl p-[1px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer border ${
        isDarkMode 
          ? 'bg-white/5 border-white/20 hover:bg-gradient-to-r hover:from-violet-500/50 hover:to-cyan-500/50 hover:shadow-violet-500/20' 
          : 'bg-white border-slate-200 hover:border-violet-400 hover:shadow-violet-500/10'
      }`}
    >
      <div className={`relative h-full flex flex-col justify-between p-6 rounded-[1.4rem] ${
        isDarkMode ? 'bg-[#0f0f11]' : 'bg-white'
      }`}>
        
        {/* Glow Hover interno - glassmorphism oculto */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative z-10 flex items-start gap-4">
          <div className={`p-4 rounded-2xl flex-shrink-0 transition-colors ${
            isDarkMode 
              ? 'bg-white/5 text-cyan-400 group-hover:bg-cyan-400/10' 
              : 'bg-slate-50 text-cyan-600 group-hover:bg-cyan-50'
          }`}>
            {icon}
          </div>
          
          <div className="flex-1 mt-1">
            <h3 className={`font-extrabold text-lg mb-1 leading-snug transition-all ${
              isDarkMode 
                ? 'text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-violet-400' 
                : 'text-slate-900 group-hover:text-violet-700'
            }`}>
              {title}
            </h3>
            <p className={`text-sm leading-relaxed ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
