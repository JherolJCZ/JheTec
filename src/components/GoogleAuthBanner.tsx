import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { RefreshCw, FolderPlus, LogOut, AlertCircle, ShieldCheck, MessageCircle, CheckCircle } from 'lucide-react';
import { logoutGoogle, googleSignIn } from '../services/firebase';
import { formatWhatsappDisplay } from '../utils/whatsapp';

interface GoogleAuthBannerProps {
  user: User | null;
  hasToken: boolean;
  onRefresh: () => void;
  isSyncing: boolean;
  onOpenSettings: () => void;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
  whatsappNumber: string;
  onSaveWhatsapp: (newNumber: string) => void;
}

export const GoogleAuthBanner: React.FC<GoogleAuthBannerProps> = ({
  user,
  onRefresh,
  isSyncing,
  onOpenSettings,
  isAdmin,
  onLogoutAdmin,
  whatsappNumber,
  onSaveWhatsapp,
}) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState(whatsappNumber);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    setWhatsappInput(whatsappNumber);
  }, [whatsappNumber]);

  const handleGoogleConnect = async () => {
    try {
      setAuthError(null);
      const res = await googleSignIn();
      if (res?.accessToken) {
        setNotificationMsg('¡Google Drive conectado con éxito!');
        setTimeout(() => setNotificationMsg(null), 3500);
        onRefresh();
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setAuthError('No se pudo vincular la cuenta de Google');
      setTimeout(() => setAuthError(null), 4000);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      onRefresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

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
      setTimeout(() => setNotificationMsg(null), 3500);
    }
  };

  // Only visible when admin is logged in
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="top-navy-bar text-slate-300 relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs flex-wrap">
        {/* Left: Admin Mode Badge */}
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs">
            Modo Administrador: <strong className="text-white">JheTec</strong>
          </span>
          {notificationMsg && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] animate-fade-in font-medium">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
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
                title="Escribe el nuevo número y haz clic en 'Actualizar' o presiona Enter"
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

          {/* Conectar Google Drive (para sincronización directa en vivo) */}
          {!user ? (
            <button
              onClick={handleGoogleConnect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900/90 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold shadow-md shadow-blue-950/40 transition-all active:scale-95 cursor-pointer"
              title="Vincular con tu cuenta de Google para sincronización directa en vivo"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              <span>Vincular Google</span>
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-950/60 text-blue-300 border border-blue-500/30 text-xs font-medium hover:bg-rose-950/60 hover:text-rose-300 transition-colors shadow-xs cursor-pointer"
              title="Cuenta de Google vinculada (clic para desvincular)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Drive Vinculado</span>
            </button>
          )}

          {/* Actualizar Button */}
          <button
            onClick={handleActualizar}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 hover:text-white border border-white/15 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            title="Actualizar catálogo y guardar cambios"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
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
        <div className="sm:hidden bg-emerald-950/90 text-emerald-200 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-1.5 border-t border-emerald-800">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {authError && (
        <div className="bg-rose-950/80 text-rose-200 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-1.5 border-t border-rose-800 backdrop-blur-md">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}
    </div>
  );
};
