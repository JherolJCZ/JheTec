import React, { useState, useEffect } from 'react';
import { RefreshCw, FolderPlus, LogOut, ShieldCheck, MessageCircle, CheckCircle } from 'lucide-react';
import { formatWhatsappDisplay } from '../utils/whatsapp';

interface GoogleAuthBannerProps {
  onRefresh: () => void;
  isSyncing: boolean;
  onOpenSettings: () => void;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
  whatsappNumber: string;
  onSaveWhatsapp: (newNumber: string) => void;
}

export const GoogleAuthBanner: React.FC<GoogleAuthBannerProps> = ({
  onRefresh,
  isSyncing,
  onOpenSettings,
  isAdmin,
  onLogoutAdmin,
  whatsappNumber,
  onSaveWhatsapp,
}) => {
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState(whatsappNumber);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    setWhatsappInput(whatsappNumber);
  }, [whatsappNumber]);

  const handleActualizar = () => {
    let updatedWhatsapp = false;
    let newDisplay = '';
    if (isEditingWhatsapp) {
      const clean = whatsappInput.replace(/[^\d]/g, '');
      if (clean) {
        onSaveWhatsapp(clean);
        newDisplay = formatWhatsappDisplay(clean);
        updatedWhatsapp = true;
      }
      setIsEditingWhatsapp(false);
    }

    onRefresh();

    if (updatedWhatsapp) {
      setNotificationMsg(`¡WhatsApp actualizado a ${newDisplay}!`);
    } else {
      setNotificationMsg('¡Catálogo sincronizado con Google Drive!');
    }
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Only visible when admin is logged in
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="top-navy-bar text-slate-300 relative z-40 border-b border-cyan-500/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs flex-wrap">
        {/* Left: Admin Mode Badge & Drive Status */}
        <div className="flex items-center gap-3 text-cyan-300 font-semibold flex-wrap">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs">
              Modo Administrador: <strong className="text-white">JheTec</strong>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Drive Vinculado</span>
          </div>

          {notificationMsg && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyan-950/90 text-cyan-200 border border-cyan-500/40 rounded-lg text-[11px] animate-fade-in font-medium">
              <CheckCircle className="w-3 h-3 text-cyan-400" />
              {notificationMsg}
            </span>
          )}
        </div>

        {/* Right Actions: Cambiar Carpeta, Cambiar WhatsApp, Actualizar, Cerrar Sesión */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Cambiar Carpeta Compartida Button */}
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold shadow-md shadow-cyan-950/40 transition-all active:scale-95 cursor-pointer"
            title="Cambiar o vincular el link de la carpeta compartida"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cambiar Carpeta</span>
          </button>

          {/* Botón / Campo para Cambiar Número de WhatsApp */}
          {isEditingWhatsapp ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/50 rounded-xl px-2 py-1 shadow-inner">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <input
                type="tel"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleActualizar();
                  } else if (e.key === 'Escape') {
                    setWhatsappInput(whatsappNumber);
                    setIsEditingWhatsapp(false);
                  }
                }}
                placeholder="Ej. 51952004149"
                className="w-28 sm:w-36 bg-slate-950/90 text-emerald-300 text-xs px-2 py-0.5 rounded-lg border border-emerald-500/40 focus:outline-none focus:border-emerald-400 font-mono"
                autoFocus
                title="Escribe el nuevo número y presiona Enter o haz clic en Actualizar"
              />
              <button
                type="button"
                onClick={() => {
                  setWhatsappInput(whatsappNumber);
                  setIsEditingWhatsapp(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 text-xs cursor-pointer"
                title="Cancelar cambio de WhatsApp"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingWhatsapp(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
              title="Hacer clic para editar el número de WhatsApp receptor de pedidos"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cambiar WhatsApp</span>
            </button>
          )}

          {/* Actualizar Button */}
          <button
            onClick={handleActualizar}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/40 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            title="Sincronizar y actualizar cambios desde Google Drive"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          {/* Cerrar Sesión Administrador */}
          <button
            onClick={onLogoutAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-semibold transition-colors shadow-xs cursor-pointer active:scale-95"
            title="Cerrar sesión de Administrador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="sm:hidden bg-cyan-950/95 text-cyan-200 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-1.5 border-t border-cyan-800">
          <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>{notificationMsg}</span>
        </div>
      )}
    </div>
  );
};
