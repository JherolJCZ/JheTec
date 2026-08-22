import React from 'react';
import {
  ShoppingBag,
  Search,
  Settings,
  X,
  Layers,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSettings: () => void;
  folderName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onOpenSettings,
  folderName,
}) => {
  return (
    <header className="sticky top-0 z-40 frosted-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Logo & Catalog Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative group cursor-pointer">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 flex items-center justify-center text-white">
                <div className="w-full h-full bg-slate-950/80 rounded-[15px] flex items-center justify-center backdrop-blur-xs">
                  <Layers className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className="gradient-text-vibrant">
                    {folderName || 'CATÁLOGO VIRTUAL'}
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 shadow-xs font-mono-tech">
                  Catálogo Activo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                <span>Catálogo interactivo en tiempo real</span>
              </p>
            </div>
          </div>

          {/* Search Input Bar with Frosted Dark Glass & Glowing Focus */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por nombre, código o colección..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 hover:bg-slate-900/80 text-white text-xs sm:text-sm rounded-2xl border border-white/15 focus:border-cyan-400 focus:bg-slate-900/90 focus:ring-2 focus:ring-cyan-500/30 focus:outline-hidden transition-all placeholder:text-slate-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Folder Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-cyan-400 border border-white/15 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Vincular o cambiar link de carpeta compartida"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-950/60 active:scale-95 transition-all border border-cyan-400/30"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-white text-slate-900 rounded-full text-[11px] flex items-center justify-center font-extrabold shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos o colecciones..."
              className="w-full pl-10 pr-10 py-2 bg-slate-900/60 text-white text-xs rounded-2xl border border-white/15 focus:border-cyan-400 focus:bg-slate-900/90 focus:outline-hidden shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
