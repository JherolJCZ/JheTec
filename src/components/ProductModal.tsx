import React, { useState } from 'react';
import { ProductItem } from '../types/catalog';
import {
  X,
  ShoppingBag,
  MessageCircle,
  ExternalLink,
  Check,
  Sparkles
} from 'lucide-react';
import { getWhatsAppProductLink } from '../utils/whatsapp';

interface ProductModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (product: ProductItem) => void;
  isInCart: boolean;
  whatsappNumber?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isInCart,
  whatsappNumber,
}) => {
  const [customNote, setCustomNote] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const handleWhatsapp = () => {
    const link = getWhatsAppProductLink(product, customNote, whatsappNumber);
    window.open(link, '_blank');
  };

  const handleAdd = () => {
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card with Frosted Dark Cyber Glass Styling */}
      <div className="relative frosted-modal rounded-3xl max-w-4xl w-full overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 max-h-[90vh] text-slate-100 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/20 shadow-md transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: High-Res Image Preview */}
        <div className="relative bg-slate-950/70 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/10 min-h-[300px]">
          <img
            src={product.highResUrl || product.imageUrl}
            alt={product.displayName}
            className="w-full h-full max-h-[460px] object-contain rounded-2xl shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const fallbackDrive = `https://drive.google.com/thumbnail?id=${product.id}&sz=w1600`;
              if (target.src !== fallbackDrive) {
                target.src = fallbackDrive;
              }
            }}
          />

          {/* Drive source indicator */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-400/40 text-[11px] text-cyan-300 font-bold flex items-center gap-1.5 shadow-md font-mono-tech">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google Drive HD</span>
          </div>
        </div>

        {/* Right: Details & Action */}
        <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-4">
            {/* Category & Code Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wide bg-cyan-950/80 text-cyan-300 border border-cyan-400/30 shadow-xs font-mono-tech">
                {product.categoryName}
              </span>

              {product.code && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/15 font-mono-tech">
                  Código: #{product.code}
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {product.displayName}
              </h2>
              {product.description && (
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-normal">
                  {product.description}
                </p>
              )}
            </div>

            {/* Google Drive Link */}
            {product.webViewLink && (
              <a
                href={product.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
              >
                <span>Ver archivo original en Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Custom Notes input for WhatsApp message */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ¿Alguna consulta específica para este producto? (Opcional):
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Ej. ¿Tienen en otros tamaños? ¿Hacen envíos a mi dirección?"
                rows={2}
                className="w-full text-xs p-3 rounded-2xl border border-white/15 bg-slate-900/70 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <a
              href={getWhatsAppProductLink(product, customNote, whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-98 transition-all border border-emerald-400/30 no-underline cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Pedir por WhatsApp</span>
            </a>

            <button
              onClick={handleAdd}
              className={`w-full py-3 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                justAdded || isInCart
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/50 border border-cyan-400/30'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 shadow-xs'
              }`}
            >
              {justAdded || isInCart ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>En tu lista de pedido</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir a lista de pedido</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
