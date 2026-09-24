import React, { useState, useEffect } from 'react';
import {
  X,
  FolderSync,
  HardDrive,
  Check,
  ClipboardPaste,
  Link2,
  FolderTree,
  Sparkles,
  UserCheck,
  User,
  LogOut,
  MessageCircle
} from 'lucide-react';
import { DEFAULT_FOLDER_ID } from '../services/driveService';
import { DEFAULT_WHATSAPP_NUMBER, cleanWhatsappNumber } from '../utils/whatsapp';

interface FolderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId: string;
  onSave: (folderId: string) => void;
  onRefresh: () => void;
  isSyncing: boolean;
  lastSynced: Date;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  whatsappNumber?: string;
  onSaveWhatsapp?: (newNumber: string) => void;
}

export const FolderSettingsModal: React.FC<FolderSettingsModalProps> = ({
  isOpen,
  onClose,
  currentFolderId,
  onSave,
  onRefresh: _onRefresh,
  isSyncing: _isSyncing,
  lastSynced,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  whatsappNumber = DEFAULT_WHATSAPP_NUMBER,
  onSaveWhatsapp,
}) => {
  const [folderInput, setFolderInput] = useState(currentFolderId);
  const [whatsappVal, setWhatsappVal] = useState(whatsappNumber);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  useEffect(() => {
    setFolderInput(currentFolderId);
    setWhatsappVal(whatsappNumber);
  }, [currentFolderId, whatsappNumber, isOpen]);

  if (!isOpen) return null;

  const handleExtractId = (val: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    // 1. match /folders/1abc...
    const matchFolder = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (matchFolder && matchFolder[1]) {
      return matchFolder[1];
    }
    // 2. match id=1abc...
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      return matchId[1];
    }
    // 3. match /file/d/1abc...
    const matchFile = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile && matchFile[1]) {
      return matchFile[1];
    }
    return trimmed;
  };

  const currentExtractedId = handleExtractId(folderInput);

  const handlePasteClipboard = async () => {
    try {
      setPasteError(null);
      const text = await navigator.clipboard.readText();
      if (text) {
        setFolderInput(text.trim());
      }
    } catch {
      setPasteError('Por favor pega el enlace manualmente en el campo.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = handleExtractId(folderInput);
    if (!cleanId) return;

    onSave(cleanId);

    if (isAdmin && onSaveWhatsapp) {
      const cleanWp = cleanWhatsappNumber(whatsappVal);
      if (cleanWp) {
        onSaveWhatsapp(cleanWp);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    setFolderInput(DEFAULT_FOLDER_ID);
    onSave(DEFAULT_FOLDER_ID);
    if (isAdmin && onSaveWhatsapp) {
      onSaveWhatsapp(DEFAULT_WHATSAPP_NUMBER);
      setWhatsappVal(DEFAULT_WHATSAPP_NUMBER);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
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

      {/* Modal Dialog with Frosted Dark Styling */}
      <div className="relative frosted-modal rounded-3xl max-w-lg w-full p-6 sm:p-8 z-10 text-slate-100 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-md">
              <FolderSync className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Vincular Carpeta Compartida
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Pega el link de la carpeta para cargar archivos y subcarpetas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Admin Icon with floating tooltip */}
            {isAdmin ? (
              <div className="relative group">
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className="p-2.5 rounded-2xl bg-emerald-950/80 hover:bg-rose-950/80 text-emerald-400 hover:text-rose-400 border border-emerald-500/40 hover:border-rose-500/40 shadow-xs transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Cerrar sesión de Administrador"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400 group-hover:hidden" />
                  <LogOut className="w-4 h-4 text-rose-400 hidden group-hover:block" />
                </button>
                {/* Floating Tooltip */}
                <div className="absolute right-0 top-full mt-2 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl border border-white/15 whitespace-nowrap z-30 pointer-events-none">
                  <span>Administrador activo (Clic para cerrar sesión)</span>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-400 border border-white/15 hover:border-cyan-400/40 shadow-xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  aria-label="Administrar"
                >
                  <User className="w-4 h-4" />
                </button>
                {/* Floating Tooltip with text 'Administrar' */}
                <div className="absolute right-0 top-full mt-2 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-cyan-400/30 whitespace-nowrap z-30 pointer-events-none">
                  <span className="text-cyan-300">Administrar</span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Link o ID de la Carpeta Compartida:
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Pegar Link</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/1aBcD... o ID de carpeta"
                className="w-full text-xs font-mono pl-10 pr-4 py-3 bg-slate-900/80 text-cyan-300 rounded-2xl border border-white/15 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all shadow-inner"
              />
            </div>

            {pasteError && (
              <p className="text-[11px] text-amber-300 mt-1">{pasteError}</p>
            )}

            {currentExtractedId && currentExtractedId !== folderInput && (
              <p className="text-[11px] text-cyan-300/90 mt-1.5 flex items-center gap-1 font-mono-tech">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>ID detectado: {currentExtractedId}</span>
              </p>
            )}

            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Puedes pegar el enlace completo de Google Drive o el ID directo de cualquier cuenta.
            </p>
          </div>

          {/* Admin WhatsApp Configuration */}
          {isAdmin && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5">
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wide">
                Número de WhatsApp para Pedidos y Consultas:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type="tel"
                  value={whatsappVal}
                  onChange={(e) => setWhatsappVal(e.target.value)}
                  placeholder="Ej: 51952004149"
                  className="w-full text-xs font-mono pl-10 pr-4 py-2.5 bg-slate-950/80 text-emerald-300 rounded-xl border border-emerald-500/30 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all shadow-inner"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Ingresa el número con código de país (ej. 51952004149). Todos los botones de compra se actualizarán.
              </p>
            </div>
          )}

          {/* Sync Stats Info */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Última sincronización:</span>
              </span>
              <span className="text-white font-mono-tech font-bold">
                {lastSynced.toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-slate-300">
              <span>Estado de conexión:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                <span>Listo para cargar</span>
              </span>
            </div>
          </div>

          {/* How to share instructions */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <FolderTree className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>¿Cómo cambiar de carpeta o cuenta?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li>
                En Google Drive, haz clic derecho sobre tu carpeta principal &gt; <strong>Compartir</strong>.
              </li>
              <li>
                En Acceso general, elige <strong>"Cualquier persona con el enlace"</strong> (Lector).
              </li>
              <li>
                Copia el enlace, pégalo en este recuadro y haz clic en <strong>"Guardar y Cargar Catálogo"</strong>.
              </li>
              <li>
                <strong className="text-cyan-300">Organización:</strong> Las fotos sueltas en la raíz se mostrarán en el carrusel de inicio y cada subcarpeta será una categoría de productos.
              </li>
            </ol>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="submit"
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 active:scale-95 transition-all border border-cyan-400/30 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Carpeta Guardada y Conectada!</span>
                </>
              ) : (
                <>
                  <FolderSync className="w-4 h-4" />
                  <span>Guardar y Cargar Catálogo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-semibold transition-all cursor-pointer"
            >
              Cargar Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
