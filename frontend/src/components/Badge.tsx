import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'accent' | 'sage' | 'neutral' | 'low' | 'in' | 'out' | 'danger' | 'transfer';
  type?: string;
  className?: string;
}

const typeMap: Record<string, string> = {
  alcoholic: 'accent',
  'non-alcoholic': 'sage',
  fruits: 'sage',
  'non-perishable': 'neutral',
  other: 'neutral',
  'stock-in': 'in',
  'stock-out': 'out',
};

const variantClasses: Record<string, string> = {
  accent: 'bg-accent-100 text-accent-800',
  sage: 'bg-sage-100 text-sage-800',
  neutral: 'bg-neutral-100 text-neutral-800',
  low: 'bg-low-tint text-low-ink',
  in: 'bg-in-tint text-in-ink',
  out: 'bg-out-tint text-out-ink',
  danger: 'bg-danger-tint text-danger-ink',
  transfer: 'bg-transfer-tint text-transfer-ink',
};

export default function Badge({ children, variant, type, className = '' }: BadgeProps) {
  const resolved = variant || (type ? typeMap[type.toLowerCase()] : undefined) || 'neutral';
  const classes = variantClasses[resolved] || variantClasses.neutral;
  return (
    <span className={`inline-flex items-center gap-1 px-[10px] py-[3px] rounded-[12px] text-xs tracking-wide ${classes} ${className}`}>
      {children}
    </span>
  );
}
