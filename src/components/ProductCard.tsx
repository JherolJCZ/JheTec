import React, { useState } from 'react';
import { ProductItem } from '../types/catalog';
import {
  ShoppingBag,
  MessageCircle,
  Maximize2,
  Check,
  Layers
} from 'lucide-react';
import { getWhatsAppProductLink } from '../utils/whatsapp';

interface ProductCardProps {
  product: ProductItem;
  onAddToCart: (product: ProductItem) => void;
  onOpenModal: (product: ProductItem) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onOpenModal,
  isInCart,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 900);
  };

  const handleWhatsappClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = getWhatsAppProductLink(product);
    window.open(link, '_blank');
  };

  return (
    <div
      onClick={() => onOpenModal(product)}
      className="group relative flex flex-col frosted-card transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.99]"
    >
      {/* Image Preview Container */}
      <div className="relative aspect-square w-full bg-slate-950/60 overflow-hidden flex items-center justify-center">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center">
            <Layers className="w-8 h-8 text-slate-700 animate-pulse" />
          </div>
        )}

        <img
          src={product.imageUrl}
          alt={product.displayName}
          className={`w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const fallbackDrive = `https://drive.google.com/thumbnail?id=${product.id}&sz=w800`;
            if (target.src !== fallbackDrive) {
              target.src = fallbackDrive;
            }
            setImageLoaded(true);
          }}
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {/* Category Tag */}
          <span className="px-2.5 py-1 rounded-xl text-[10px] uppercase font-bold tracking-wider bg-slate-900/85 backdrop-blur-md text-cyan-300 border border-cyan-400/30 shadow-md font-mono-tech">
            {product.categoryName}
          </span>

          {/* Product ID / Code */}
          {product.code && (
            <span className="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-slate-900/85 backdrop-blur-md text-slate-200 border border-white/20 shadow-md font-mono-tech">
              #{product.code}
            </span>
          )}
        </div>

        {/* Quick View Hover Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 text-white border border-cyan-400/40 shadow-xl shadow-black/60 flex items-center gap-1.5 text-xs font-bold">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span>Ver foto completa</span>
          </div>
        </div>
      </div>

      {/* Card Info Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            {product.displayName}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-normal leading-relaxed">
            {product.description || `Colección: ${product.categoryName}`}
          </p>
        </div>

        {/* Action Buttons: WhatsApp & Cart */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2">
          {/* Quick WhatsApp Inquiry Button */}
          <button
            type="button"
            onClick={handleWhatsappClick}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-95 border border-emerald-400/30"
            title="Consultar disponibilidad por WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>Pedir</span>
          </button>

          {/* Add To Cart / Pedido Button */}
          <button
            type="button"
            onClick={handleAddClick}
            className={`p-2.5 sm:px-3 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-90 ${
              isInCart || addedAnimation
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/60 border border-cyan-400/40'
                : 'bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/15 shadow-xs'
            }`}
            title={isInCart ? 'En tu lista de pedido' : 'Añadir a la lista de pedido'}
          >
            {addedAnimation || isInCart ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Listo</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
