import { useEffect, useState, useCallback } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { getStock, stockIn, stockOut } from '../../api/client';
import type { InventoryItem, StockMovement } from '../../types';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const PAGE_SIZE = 10;

// Movements are read as a running log, so elapsed time is more useful
// here than a calendar date.
function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;
  const years = Math.round(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export default function StockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [movePage, setMovePage] = useState(1);
  const [dialogItem, setDialogItem] = useState<InventoryItem | null>(null);
  const [dialogDir, setDialogDir] = useState<'in' | 'out'>('in');

  const load = useCallback(async () => {
    const { data } = await getStock();
    if (data) {
      setItems(data.items);
      setMovements(data.recent_movements);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Pagination for items
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Pagination for movements
  const moveTotalPages = Math.ceil(movements.length / PAGE_SIZE);
  const pagedMovements = movements.slice((movePage - 1) * PAGE_SIZE, movePage * PAGE_SIZE);
  const moveRangeLabel = movements.length > 0
    ? `${(movePage - 1) * PAGE_SIZE + 1}–${Math.min(movePage * PAGE_SIZE, movements.length)} of ${movements.length}`
    : '0 entries';

  const openDialog = (item: InventoryItem, dir: 'in' | 'out') => {
    setDialogItem(item);
    setDialogDir(dir);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Stock in / out</h1>
        <p className="text-base text-ink/70 mt-1">Adjust quantities and view the movement log.</p>
      </div>

      {/* Items table */}
      <div className="bg-surface border border-divider rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Product</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">On hand</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Par</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => (
                <tr key={item.id} className="border-b border-divider last:border-b-0 hover:bg-ink/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-[5px] h-8 rounded-full shrink-0 ${item.is_low_stock ? 'bg-low-edge' : 'bg-transparent'}`} />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-ink">{item.product_name}</span>
                        <Badge type={item.category || 'other'}>{item.category || 'Other'}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{item.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/70">{item.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDialog(item, 'in')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-pill border border-divider text-ink hover:bg-in-tint hover:text-in-ink hover:border-in-edge focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                      >
                        <ArrowDown size={12} /> In
                      </button>
                      <button
                        onClick={() => openDialog(item, 'out')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-pill border border-divider text-ink hover:bg-out-tint hover:text-out-ink hover:border-out-edge focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                      >
                        <ArrowUp size={12} /> Out
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-semibold rounded-pill border border-divider text-ink disabled:opacity-40 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
            >
              Previous
            </button>
            <span className="text-xs text-ink/55 tabular-nums">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-semibold rounded-pill border border-divider text-ink disabled:opacity-40 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Movement log */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Movement log</h2>
          <span className="text-xs text-ink/55 tabular-nums">{moveRangeLabel}</span>
        </div>

        {movements.length === 0 ? (
          <p className="text-sm text-ink/55">No movements recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pagedMovements.map((m, i) => {
              const isIn = m.movement_type === 'in';
              return (
                <div
                  key={m.id ?? i}
                  className="flex items-center gap-3 bg-surface border border-divider rounded-pill py-2 px-4"
                >
                  <span className={`w-[30px] h-[30px] rounded-full grid place-items-center shrink-0 ${isIn ? 'bg-in-tint text-in-ink' : 'bg-out-tint text-out-ink'}`}>
                    {isIn ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                  </span>
                  <span className="font-bold tabular-nums text-sm text-ink">
                    {isIn ? '+' : '−'}{m.quantity}
                  </span>
                  <span className="font-semibold text-sm text-ink">{m.product_name}</span>
                  {m.note && <span className="text-sm text-ink/70 flex-1 truncate">{m.note}</span>}
                  {!m.note && <span className="flex-1" />}
                  <span className="text-[12px] text-ink/55 shrink-0 tabular-nums">
                    {m.created_at ? timeAgo(m.created_at) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {moveTotalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setMovePage((p) => Math.max(1, p - 1))}
              disabled={movePage === 1}
              className="px-3 py-1.5 text-sm font-semibold rounded-pill border border-divider text-ink disabled:opacity-40 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
            >
              Previous
            </button>
            <span className="text-xs text-ink/55 tabular-nums">Page {movePage} of {moveTotalPages}</span>
            <button
              onClick={() => setMovePage((p) => Math.min(moveTotalPages, p + 1))}
              disabled={movePage === moveTotalPages}
              className="px-3 py-1.5 text-sm font-semibold rounded-pill border border-divider text-ink disabled:opacity-40 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Adjust dialog */}
      <AdjustDialog
        item={dialogItem}
        initialDir={dialogDir}
        onClose={() => setDialogItem(null)}
        onSuccess={() => { setDialogItem(null); load(); }}
      />
    </div>
  );
}

/* ----- Adjust Dialog ----- */

function AdjustDialog({
  item,
  initialDir,
  onClose,
  onSuccess,
}: {
  item: InventoryItem | null;
  initialDir: 'in' | 'out';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [dir, setDir] = useState<'in' | 'out'>(initialDir);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => { setDir(initialDir); }, [initialDir]);
  useEffect(() => { setQuantity(''); setNote(''); setError(''); }, [item]);

  const currentQty = item?.quantity ?? 0;
  const qty = Number(quantity) || 0;
  const preview = dir === 'in' ? currentQty + qty : currentQty - qty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (qty <= 0) { setError('Quantity must be greater than 0'); return; }
    if (dir === 'out' && qty > currentQty) { setError(`Cannot exceed available (${currentQty})`); return; }
    setSubmitting(true);
    setError('');

    const fn = dir === 'in' ? stockIn : stockOut;
    const { error: apiErr } = await fn(item.id, { quantity: qty, note });

    if (apiErr) {
      setError(apiErr);
      setSubmitting(false);
    } else {
      showToast(`Stock ${dir === 'in' ? 'received' : 'deducted'}`);
      onSuccess();
    }
  };

  return (
    <Modal open={item !== null} onClose={onClose} ariaLabelledBy="adjust-title">
      {item && (
        <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-[400px]">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-ink/55 mb-1">Adjust stock</p>
          <h2 id="adjust-title" className="font-display text-2xl font-bold text-ink mb-4">
            {item.product_name}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Direction toggle */}
            <div className="flex rounded-pill border border-divider overflow-hidden">
              <button
                type="button"
                onClick={() => setDir('in')}
                className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors focus:outline-none ${
                  dir === 'in' ? 'bg-in-tint text-in-ink' : 'text-ink/55 hover:bg-ink/[0.04]'
                }`}
              >
                In
              </button>
              <button
                type="button"
                onClick={() => setDir('out')}
                className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors focus:outline-none ${
                  dir === 'out' ? 'bg-out-tint text-out-ink' : 'text-ink/55 hover:bg-ink/[0.04]'
                }`}
              >
                Out
              </button>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1">
              <label htmlFor="adj-qty" className="text-[12px] text-ink/70 font-medium">Quantity</label>
              <input
                id="adj-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-divider rounded-pill text-base text-ink caret-accent-500 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20"
              />
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1">
              <label htmlFor="adj-note" className="text-[12px] text-ink/70 font-medium">Note (optional)</label>
              <input
                id="adj-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Delivery from supplier"
                className="w-full px-4 py-2 bg-surface border border-divider rounded-pill text-base text-ink caret-accent-500 placeholder:text-ink/45 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20"
              />
            </div>

            {/* Preview */}
            <p className="text-sm text-ink/70 tabular-nums">
              Stock level <span className="font-semibold text-ink">{currentQty}</span> → <span className="font-semibold text-ink">{preview}</span>
            </p>

            {error && <p className="text-sm text-danger-ink">{error}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-display font-bold rounded-pill border border-divider text-ink hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus:outline-none"
              >
                {submitting ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
