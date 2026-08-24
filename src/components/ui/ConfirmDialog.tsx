import { useState, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200/60 p-6 animate-scale-in">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle className="text-red-500" size={20} />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-stone-800 font-display">{title}</h3>
            <p className="text-sm text-stone-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary flex-1">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${danger ? 'btn bg-red-500 text-white hover:bg-red-600' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const confirm = (title: string, message: string, onConfirm: () => void) => {
    setState({ open: true, title, message, onConfirm });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  const dialog: ReactNode = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      onConfirm={() => {
        state.onConfirm();
        close();
      }}
      onCancel={close}
    />
  );

  return { confirm, dialog };
}
