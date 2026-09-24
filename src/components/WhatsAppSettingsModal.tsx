import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  DEFAULT_WHATSAPP_NUMBER,
  cleanWhatsappNumber,
  formatWhatsappDisplay,
} from '../utils/whatsapp';

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWhatsappNumber: string;
  onSave: (newNumber: string) => void;
  onRefresh?: () => void;
}

export const WhatsAppSettingsModal: React.FC<WhatsAppSettingsModalProps> = ({
  isOpen,
  onClose,
  currentWhatsappNumber,
  onSave,
  onRefresh,
}) => {
  const [inputVal, setInputVal] = useState(currentWhatsappNumber);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputVal(currentWhatsappNumber);
    setError(null);
    setSuccess(false);
  }, [currentWhatsappNumber, isOpen]);

  if (!isOpen) return null;

  const cleaned = cleanWhatsappNumber(inputVal);
  const displayFormatted = formatWhatsappDisplay(cleaned);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cleaned || cleaned.length < 7) {
      setError('Por favor ingresa un número de teléfono válido con código de país (ej: 51952004149).');
      return;
    }

    onSave(cleaned);
    if (onRefresh) {
      onRefresh();
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    setInputVal(DEFAULT_WHATSAPP_NUMBER);
    onSave(DEFAULT_WHATSAPP_NUMBER);
    if (onRefresh) {
      onRefresh();
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
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
            <div className="p-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shadow-md">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Cambiar WhatsApp
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Número que recibirá todos los pedidos y consultas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">
              Número de WhatsApp (con código de país):
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="tel"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setError(null);
                }}
                placeholder="Ej. 51952004149"
                className="w-full text-sm font-mono pl-10 pr-4 py-3 bg-slate-900/80 text-emerald-300 rounded-2xl border border-white/15 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all shadow-inner"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-[11px] text-rose-400 mt-1.5 font-medium">{error}</p>
            )}

            {/* Live formatting & preview info */}
            {cleaned && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-emerald-500/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Visualización en catálogo:</span>
                  <span className="font-bold text-white font-mono">{displayFormatted}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Enlace directo wa.me:</span>
                  <a
                    href={`https://wa.me/${cleaned}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                  >
                    <span>Probar enlace</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-[11px] text-slate-400 mt-2.5 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Para Perú inicia con <strong>51</strong> seguido de tu número (ej: <strong>51952004149</strong>). Al hacer clic en <strong>Actualizar</strong>, todos los botones de WhatsApp de la tienda se actualizarán inmediatamente.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="submit"
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-95 transition-all border border-emerald-400/30 cursor-pointer"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡WhatsApp Actualizado!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Actualizar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/15 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title="Restaurar número original"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restaurar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
