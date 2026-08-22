import React from 'react';
import {
  Layers,
  Phone,
  HardDrive,
  ShieldCheck
} from 'lucide-react';

interface FooterProps {
  folderName: string;
  totalProducts: number;
}

export const Footer: React.FC<FooterProps> = ({ folderName, totalProducts }) => {
  return (
    <footer className="frosted-footer text-slate-400 mt-16 transition-colors relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Sync info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                {folderName}
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-md leading-relaxed font-normal">
              Catálogo virtual interactivo conectado a Google Drive. Todos los productos,
              imágenes y categorías se sincronizan en vivo sin necesidad de base de datos externa.
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 text-cyan-300 border border-cyan-400/30 shadow-sm font-semibold font-mono-tech">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>{totalProducts} Productos</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold font-mono-tech">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Catálogo en Vivo</span>
              </span>
            </div>
          </div>

          {/* Quick Help & How it works */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-tech">
              ¿Cómo comprar?
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-normal">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.8)]"></span>
                <span>Explora las colecciones por categoría.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.8)]"></span>
                <span>Haz clic en "Pedir" o añade varios productos a tu carrito.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.8)]"></span>
                <span>Envía el pedido directamente por WhatsApp para concretar pago y envío.</span>
              </li>
            </ul>
          </div>

          {/* Contact Direct */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-tech">
              Atención y Pedidos
            </h4>
            <p className="text-xs text-slate-400 font-normal">
              Escríbenos directamente para cotizaciones o pedidos:
            </p>
            <div className="inline-flex items-center gap-2 text-white font-bold text-sm sm:text-base tracking-wide select-all">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>+51 952 004 149</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {folderName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-ping inline-block"></span>
            <span className="text-emerald-400 font-medium">Sincronización en Tiempo Real</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
