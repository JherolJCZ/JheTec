import React from 'react';
import { User } from 'firebase/auth';
import { RefreshCw, FolderPlus, LogOut, AlertCircle, ShieldCheck } from 'lucide-react';
import { logoutGoogle } from '../services/firebase';

interface GoogleAuthBannerProps {
  user: User | null;
  hasToken: boolean;
  onRefresh: () => void;
  isSyncing: boolean;
  onOpenSettings: () => void;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
}

export const GoogleAuthBanner: React.FC<GoogleAuthBannerProps> = ({
  user,
  onRefresh,
  isSyncing,
  onOpenSettings,
  isAdmin,
  onLogoutAdmin,
}) => {
  const [authError] = React.useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      onRefresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Only visible when admin is logged in
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="top-navy-bar text-slate-300 relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs">
        {/* Left: Admin Mode Badge */}
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs">Modo Administrador: <strong className="text-white">JheTec</strong></span>
        </div>

        {/* Right Actions: Actualizar & Cambiar Carpeta */}
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

          {/* Actualizar Button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 hover:text-white border border-white/15 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            title="Recargar y sincronizar productos y subcarpetas"
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

          {user && (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10 text-[11px] font-medium transition-colors shadow-xs"
              title="Cerrar sesión de Google"
            >
              <LogOut className="w-3 h-3" />
              <span>Google</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-rose-950/80 text-rose-200 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-1.5 border-t border-rose-800 backdrop-blur-md">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}
    </div>
  );
};
