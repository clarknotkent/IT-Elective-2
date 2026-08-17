import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getIngredients, deleteIngredient } from '../../api/client';
import type { Ingredient } from '../../types';
import { useToast } from '../../context/ToastContext';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

const PAGE_SIZE = 10;

export default function IngredientList() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const { data } = await getIngredients();
    if (data) setIngredients(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = ingredients.filter((ing) =>
    !search || ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeLabel = filtered.length > 0
    ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`
    : '0 items';

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await deleteIngredient(deleteTarget.id);
    if (error) showToast(error, 'error');
    else {
      showToast('Ingredient deleted');
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
          <h1 className="font-display text-3xl font-bold text-ink">Ingredient catalog</h1>
          <p className="text-base text-ink/70 mt-1">Master list of all bar stock ingredients.</p>
        </div>
        <Link
          to="/ingredients/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus:outline-none self-start sm:self-auto"
        >
          <Plus size={15} /> Add ingredient
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search ingredients..." />
        <span className="ml-auto text-xs text-ink/55 tabular-nums">{rangeLabel}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No ingredients"
          message={search ? 'Try a different search term.' : 'Add your first ingredient to get started.'}
          action={
            <Link
              to="/ingredients/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600"
            >
              <Plus size={15} /> Add ingredient
            </Link>
          }
        />
      ) : (
        <div className="bg-surface border border-divider rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-ink/55 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((ing) => (
                  <tr key={ing.id} className="border-b border-divider last:border-b-0 hover:bg-ink/[0.02]">
                    <td className="px-4 py-3 font-semibold text-ink">{ing.name}</td>
                    <td className="px-4 py-3">
                      <Badge type={ing.ingredient_type}>{ing.type_label || ing.ingredient_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {(ing.inventory_count ?? 0) > 0 ? (
                        <Badge variant="in">In use</Badge>
                      ) : (
                        <Badge variant="neutral">Not stocked</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/ingredients/${ing.id}/edit`}
                          className="w-8 h-8 grid place-items-center rounded-full bg-ink/[0.06] text-ink hover:bg-ink/[0.12] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                          aria-label={`Edit ${ing.name}`}
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(ing)}
                          className="w-8 h-8 grid place-items-center rounded-full bg-danger-tint text-danger-ink hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
                          aria-label={`Delete ${ing.name}`}
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
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete ingredient"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
