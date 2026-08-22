import React, { useState } from 'react';
import { X, Lock, User, KeyRound, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Exact credentials requested: Usuario: JheTec, Contraseña: Jherol27*
    if (username.trim() === 'JheTec' && password === 'Jherol27*') {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setUsername('');
        setPassword('');
        onLoginSuccess();
        onClose();
      }, 700);
    } else {
      setError('Credenciales incorrectas. Verifique el usuario y la contraseña.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative frosted-modal rounded-3xl max-w-md w-full p-6 sm:p-8 z-10 text-slate-100 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-md">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Acceso de Administración
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Inicia sesión para gestionar carpetas y actualizar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Acceso concedido! Cargando panel...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
              Usuario:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoFocus
                required
                className="w-full text-xs pl-10 pr-4 py-3 bg-slate-900/80 text-white rounded-2xl border border-white/15 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
              Contraseña:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-xs pl-10 pr-4 py-3 bg-slate-900/80 text-white rounded-2xl border border-white/15 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 active:scale-95 transition-all border border-cyan-400/30 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>Ingresar como Administrador</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
