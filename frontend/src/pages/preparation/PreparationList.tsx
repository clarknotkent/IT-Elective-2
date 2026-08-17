import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Undo2, Trash2 } from 'lucide-react';
import { getPreparation, returnTransfer, deleteTransfer } from '../../api/client';
import type { PreparationTransfer } from '../../types';
import { useToast } from '../../context/ToastContext';
import SearchInput from '../../components/SearchInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function PreparationList() {
  const [transfers, setTransfers] = useState<PreparationTransfer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<PreparationTransfer | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const { data } = await getPreparation();
    if (data) setTransfers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transfers.filter((t) =>
    !search || t.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleReturn = async (t: PreparationTransfer) => {
    const { error } = await returnTransfer(t.id);
    if (error) showToast(error, 'error');
    else {
      showToast('Stock returned to inventory');
      load();
    }
  };

  const handleUsedBroken = async () => {
    if (!confirmTarget) return;
    const { error } = await deleteTransfer(confirmTarget.id);
    if (error) showToast(error, 'error');
    else {
      showToast('Transfer closed (used/broken)');
      load();
    }
    setConfirmTarget(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Preparation</h1>
        <p className="text-base text-ink/70 mt-1">Items transferred out for a booked event.</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search transfers..." />

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No transfers"
          message={search ? 'Nothing matches your search.' : 'Transfer items from inventory to prepare for an event.'}
          icon={<Calendar size={22} />}
          action={
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600"
            >
              Go to inventory
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}>
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-surface border border-divider rounded-xl p-5 flex flex-col gap-3"
            >
              {/* Name + timestamp */}
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-[20px] font-bold text-ink">{t.product_name}</span>
                {t.transferred_at && (
                  <span className="text-[12px] text-ink/55">
                    Transferred at {new Date(t.transferred_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Booking date badge */}
              {t.booking_date && (
                <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 bg-transfer-tint text-transfer-ink rounded-pill text-xs font-medium">
                  <Calendar size={12} /> {t.booking_date}
                </span>
              )}

              {/* Quantity */}
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[30px] font-bold leading-none text-ink">{t.quantity}</span>
                <span className="text-sm text-ink/70">units out of stock</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleReturn(t)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-pill bg-in-tint text-in-ink border border-in-edge hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                >
                  <Undo2 size={14} /> Return unused to stock
                </button>
                <button
                  onClick={() => setConfirmTarget(t)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-pill bg-danger-tint text-danger-ink border border-danger-edge hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                >
                  <Trash2 size={14} /> Used or broken
                </button>
                <p className="text-[12px] text-ink/55">
                  Used or broken closes the transfer without returning stock.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmTarget !== null}
        title="Mark as used or broken"
        message={`This will close the transfer for "${confirmTarget?.product_name}" without returning any stock. This cannot be undone.`}
        confirmLabel="Close transfer"
        onConfirm={handleUsedBroken}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
