import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, RefreshCw, MapPin, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { getInventory, deleteItem, getReportUrl } from '../../api/client';
import type { InventoryItem } from '../../types';
import { useToast } from '../../context/ToastContext';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import TransferDialog from './TransferDialog';

const PAGE_SIZE = 10;

export default function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [transferTarget, setTransferTarget] = useState<InventoryItem | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const { data } = await getInventory();
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtering
  const filtered = items.filter((item) => {
    const matchSearch = !search || (item.product_name?.toLowerCase().includes(search.toLowerCase()));
    const matchLow = !lowOnly || item.is_low_stock;
    return matchSearch && matchLow;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeLabel = filtered.length > 0
    ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`
    : '0 items';

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, lowOnly]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await deleteItem(deleteTarget.id);
    if (error) showToast(error, 'error');
    else {
      showToast('Item deleted');
      load();
    }
    setDeleteTarget(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Inventory</h1>
          <p className="text-base text-ink/70 mt-1">Track quantities and par levels for each product.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={getReportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-display font-bold rounded-pill border border-divider text-ink hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
          >
            <Download size={15} /> Download report
          </a>
          <Link
            to="/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus:outline-none"
          >
            <Plus size={15} /> Add item
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
        <button
          onClick={() => setLowOnly(!lowOnly)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-pill border transition-colors focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none ${
            lowOnly
              ? 'bg-low-tint text-low-ink border-low-edge'
              : 'bg-transparent text-ink/70 border-divider hover:border-ink/40'
          }`}
        >
          Low stock only
        </button>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="p-2 rounded-pill text-ink/55 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
          aria-label="Refresh"
        >
          <RefreshCw size={16} />
        </button>
        <span className="ml-auto text-xs text-ink/55 tabular-nums">{rangeLabel}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No inventory items"
          message={search || lowOnly ? 'Try adjusting your filters.' : 'Add your first item to get started.'}
          action={
            <Link
              to="/inventory/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600"
            >
              <Plus size={15} /> Add item
            </Link>
          }
        />
      ) : (
        <div className="bg-surface border border-divider rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Type</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">On hand</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Par</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Event date</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id} className="border-b border-divider last:border-b-0 hover:bg-ink/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-stretch gap-3">
                        <div className={`w-[5px] rounded-full shrink-0 ${item.is_low_stock ? 'bg-low-edge' : 'bg-transparent'}`} />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-ink">{item.product_name}</span>
                          {item.location && (
                            <span className="flex items-center gap-1 text-[12px] text-ink/55">
                              <MapPin size={11} /> {item.location}
                            </span>
                          )}
                          {item.is_low_stock && <Badge variant="low">Low</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge type={item.category || 'other'}>{item.category || 'Other'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink/70">{item.stock}</td>
                    <td className="px-4 py-3 text-ink/70">{item.event_date || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setTransferTarget(item)}
                          className="w-8 h-8 grid place-items-center rounded-full bg-transfer-tint text-transfer-ink hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                          aria-label={`Transfer ${item.product_name}`}
                        >
                          <ArrowRight size={14} />
                        </button>
                        <Link
                          to={`/inventory/${item.id}/edit`}
                          className="w-8 h-8 grid place-items-center rounded-full bg-ink/[0.06] text-ink hover:bg-ink/[0.12] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                          aria-label={`Edit ${item.product_name}`}
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="w-8 h-8 grid place-items-center rounded-full bg-danger-tint text-danger-ink hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                          aria-label={`Delete ${item.product_name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-semibold rounded-pill border border-divider text-ink disabled:opacity-40 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
              >
                Previous
              </button>
              <span className="text-xs text-ink/55 tabular-nums">
                Page {page} of {totalPages}
              </span>
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
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete item"
        message={`Are you sure you want to delete "${deleteTarget?.product_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <TransferDialog
        open={transferTarget !== null}
        item={transferTarget}
        onClose={() => setTransferTarget(null)}
        onSuccess={() => { setTransferTarget(null); load(); }}
      />
    </div>
  );
}
