export default function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
          >
            {confirmLabel || 'Ya'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border py-2 text-sm text-muted-foreground"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
