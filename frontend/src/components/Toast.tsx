import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
}

const styles: Record<string, { bg: string; fg: string; border: string }> = {
  success: { bg: 'bg-in-tint', fg: 'text-in-ink', border: 'border-in-edge' },
  error: { bg: 'bg-danger-tint', fg: 'text-danger-ink', border: 'border-danger-edge' },
  warning: { bg: 'bg-low-tint', fg: 'text-low-ink', border: 'border-low-edge' },
};

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const s = styles[type] ?? styles.success;

  return (
    <div role="alert" className={`flex items-center gap-3 px-4 py-2 rounded-pill text-base shadow-md border ${s!.bg} ${s!.fg} ${s!.border}`}>
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss" className="w-6 h-6 rounded-pill grid place-items-center hover:bg-ink/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
        <X size={14} strokeWidth={2.75} />
      </button>
    </div>
  );
}
