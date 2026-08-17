import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="bg-surface rounded-xl p-8 flex flex-col items-center gap-2 text-center">
      <span className="w-[54px] h-[54px] rounded-pill bg-bg grid place-items-center opacity-70 mb-1">
        {icon || <Search size={22} strokeWidth={2.75} />}
      </span>
      <div className="font-display text-xl font-bold text-ink">{title || 'No items found'}</div>
      {message && <div className="text-base text-ink/70 max-w-[42ch]">{message}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
