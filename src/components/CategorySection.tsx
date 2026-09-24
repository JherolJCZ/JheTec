import React from 'react';
import { CategoryFolder, ProductItem } from '../types/catalog';
import { ProductCard } from './ProductCard';
import { Folder, Image as ImageIcon } from 'lucide-react';

interface CategorySectionProps {
  category: CategoryFolder;
  onAddToCart: (product: ProductItem) => void;
  onOpenModal: (product: ProductItem) => void;
  cartProductIds: Set<string>;
  whatsappNumber?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  onAddToCart,
  onOpenModal,
  cartProductIds,
  whatsappNumber,
}) => {
  return (
    <section
      id={`section-${category.id}`}
      className="scroll-mt-28 pt-6 pb-12 border-b border-white/10 last:border-b-0"
    >
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.7)]"></span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{category.displayName}</span>
              </h2>
              {category.description && (
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-normal">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-semibold bg-slate-900/70 border border-white/10 text-cyan-300 shadow-sm font-mono-tech">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{category.items.length} {category.items.length === 1 ? 'producto' : 'productos'}</span>
          </span>
        </div>
      </div>

      {/* Grid of Product Cards */}
      {category.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {category.items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onOpenModal={onOpenModal}
              isInCart={cartProductIds.has(product.id)}
              whatsappNumber={whatsappNumber}
            />
          ))}
        </div>
      ) : (
        <div className="frosted-card p-8 text-center">
          <Folder className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-200">
            No hay imágenes dentro de esta carpeta de Google Drive aún.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sube imágenes a la carpeta "{category.name}" en Drive y presiona el botón Actualizar.
          </p>
        </div>
      )}
    </section>
  );
};
