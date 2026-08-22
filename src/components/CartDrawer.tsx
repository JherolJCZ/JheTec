import React, { useState } from 'react';
import { CartItem } from '../types/catalog';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  ShoppingBag,
  Send
} from 'lucide-react';
import {
  formatCartWhatsAppMessage,
  WHATSAPP_NUMBER,
  WHATSAPP_DISPLAY,
} from '../utils/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  if (!isOpen) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendWhatsAppOrder = () => {
    if (items.length === 0) return;

    const message = formatCartWhatsAppMessage(
      items,
      customerName,
      deliveryAddress,
      generalNotes
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-950/95 backdrop-blur-2xl text-slate-100 flex flex-col shadow-2xl border-l border-white/10">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-md">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Lista de Pedido</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono-tech">
                    {totalItemsCount}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Envío directo por WhatsApp al comercio
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">
                    Tu lista está vacía
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Explora el catálogo y añade los productos que deseas cotizar o encargar.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/60 transition-all border border-cyan-400/30 active:scale-95"
                >
                  Explorar catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/10">
                  <span>Productos seleccionados ({items.length})</span>
                  <button
                    onClick={onClearCart}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar lista</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 flex gap-3.5 items-center shadow-md"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={product.imageUrl}
                        alt={product.displayName}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-950 border border-white/10 shrink-0"
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono-tech">
                          {product.categoryName}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {product.displayName}
                        </h4>
                        {product.code && (
                          <p className="text-[11px] text-slate-300 font-mono-tech font-bold">
                            #{product.code}
                          </p>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-white/15 rounded-xl bg-slate-950 overflow-hidden shadow-inner">
                            <button
                              onClick={() =>
                                onUpdateQuantity(product.id, quantity - 1)
                              }
                              className="p-1 px-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-cyan-300 font-mono-tech">
                              {quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateQuantity(product.id, quantity + 1)
                              }
                              className="p-1 px-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(product.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-auto"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Checkout Form Fields */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Datos del pedido (Opcional)
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Tu Nombre / Contacto:
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full text-xs px-3 py-2 bg-slate-900/80 text-white rounded-xl border border-white/15 focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Dirección o Ciudad de Entrega:
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej. Medellín, Envigado..."
                      className="w-full text-xs px-3 py-2 bg-slate-900/80 text-white rounded-xl border border-white/15 focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Notas o Comentarios Adicionales:
                    </label>
                    <textarea
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      placeholder="Ej. ¿Tienen entrega inmediata? ¿Cuáles son los métodos de pago?"
                      rows={2}
                      className="w-full text-xs p-2.5 bg-slate-900/80 text-white rounded-xl border border-white/15 focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none shadow-inner"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout CTA */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Total de productos:</span>
                <span className="text-white font-bold font-mono-tech">
                  {totalItemsCount} unidad(es)
                </span>
              </div>

              <button
                onClick={handleSendWhatsAppOrder}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/70 active:scale-98 transition-all border border-emerald-400/30"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Enviar Pedido a WhatsApp</span>
                <Send className="w-4 h-4 ml-1" />
              </button>

              <p className="text-[11px] text-slate-400 text-center font-medium">
                Se abrirá tu WhatsApp con la lista formateada para {WHATSAPP_DISPLAY}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
