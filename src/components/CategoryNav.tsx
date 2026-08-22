import React from 'react';
import { CategoryFolder } from '../types/catalog';
import { Folder, Grid } from 'lucide-react';

interface CategoryNavProps {
  categories: CategoryFolder[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  totalProducts: number;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  totalProducts,
}) => {
  if (categories.length === 0) return null;

  return (
    <div className="sticky top-16 sm:top-20 z-30 bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-3 px-4 sm:px-6 lg:px-8 transition-all shadow-md">
      <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400 mr-2 shrink-0 hidden md:inline-flex items-center gap-1.5 font-mono-tech">
          <Grid className="w-3.5 h-3.5 text-cyan-400" /> Colecciones:
        </span>

        {/* "Ver Todas las Carpetas" Pill */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
            activeCategoryId === null
              ? 'frosted-pill-active'
              : 'frosted-pill'
          }`}
        >
          <span>Todos los productos</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeCategoryId === null
                ? 'bg-white/25 text-white'
                : 'bg-white/10 text-slate-300'
            }`}
          >
            {totalProducts}
          </span>
        </button>

        {/* Category Pills */}
        {categories.map((cat) => {
          const isSelected = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                isSelected
                  ? 'frosted-pill-active'
                  : 'frosted-pill'
              }`}
            >
              <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-white fill-white/20' : 'text-cyan-400'}`} />
              <span>{cat.displayName}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {cat.items.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
