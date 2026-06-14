import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const Icon = type === 'success' ? CheckCircle : XCircle;
  const styles = type === 'success'
    ? 'border-green-500/50 bg-green-50 text-green-700'
    : 'border-red-500/50 bg-red-50 text-red-700';

  return (
    <div className={`fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg lg:bottom-6 ${styles}`}>
      <Icon size={16} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 rounded p-0.5 hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  );
}
