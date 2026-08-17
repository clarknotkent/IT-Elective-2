import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { getIngredients, getInventory, createItem, updateItem } from '../../api/client';
import type { Ingredient, InventoryItem } from '../../types';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface FieldErrors {
  ingredient?: string;
  quantity?: string;
  par?: string;
  event_date?: string;
  location?: string;
}

export default function InventoryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [par, setPar] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    async function load() {
      const ingRes = await getIngredients();
      if (ingRes.data) setIngredients(ingRes.data);

      if (isEdit && id) {
        const invRes = await getInventory();
        if (invRes.data) {
          const item = invRes.data.find((i: InventoryItem) => i.id === Number(id));
          if (item) {
            setIngredientId(String(item.ingredient_id));
            setQuantity(String(item.quantity));
            setPar(String(item.stock));
            setEventDate(item.event_date || '');
            setLocation(item.location || '');
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [id, isEdit]);

  function parseApiErrors(errorStr: string): FieldErrors {
    const errs: FieldErrors = {};
    const parts = errorStr.split('; ');
    for (const part of parts) {
      if (/ingredient/i.test(part)) errs.ingredient = part;
      else if (/quantity/i.test(part)) errs.quantity = part;
      else if (/(par|stock level)/i.test(part)) errs.par = part;
      else if (/(event_date|event date)/i.test(part)) errs.event_date = part;
      else errs.location = part;
    }
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      ingredient_id: Number(ingredientId) || null,
      quantity: Number(quantity) || 0,
      stock: Number(par) || 0,
      event_date: eventDate || null,
      location: location || null,
    };

    const res = isEdit && id
      ? await updateItem(id, payload)
      : await createItem(payload);

    if (res.error) {
      setFieldErrors(parseApiErrors(res.error));
      setSubmitting(false);
    } else {
      showToast(isEdit ? 'Item updated' : 'Item created');
      navigate('/inventory');
    }
  };

  const errorCount = Object.keys(fieldErrors).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Back button */}
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1 text-sm font-display font-bold text-ink/70 hover:text-ink rounded-pill self-start px-2 py-1 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
      >
        <ChevronLeft size={16} /> Inventory
      </Link>

      <h1 className="font-display text-3xl font-bold text-ink">
        {isEdit ? 'Edit item' : 'Add item'}
      </h1>

      {/* Error summary */}
      {errorCount > 0 && (
        <div className="flex items-center gap-2 bg-danger-tint border border-danger-edge rounded-md px-4 py-3">
          <AlertTriangle size={16} className="text-danger-ink shrink-0" />
          <span className="text-sm text-danger-ink font-medium">
            Fix {errorCount} field{errorCount > 1 ? 's' : ''} below before saving
          </span>
        </div>
      )}

      {/* Form card */}
      <form onSubmit={handleSubmit} className="bg-surface border border-divider rounded-xl p-6 flex flex-col gap-5" noValidate>
        {/* Ingredient */}
        <div className="flex flex-col gap-1">
          <label htmlFor="ingredient" className="text-[12px] text-ink/70 font-medium">Ingredient</label>
          <select
            id="ingredient"
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
              fieldErrors.ingredient ? 'border-danger-edge' : 'border-divider'
            }`}
            aria-invalid={!!fieldErrors.ingredient}
          >
            <option value="">Select ingredient…</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
          {fieldErrors.ingredient && <p className="text-[12px] text-danger-ink">{fieldErrors.ingredient}</p>}
        </div>

        {/* Quantity + Par */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="quantity" className="text-[12px] text-ink/70 font-medium">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink caret-accent-500 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
                fieldErrors.quantity ? 'border-danger-edge' : 'border-divider'
              }`}
              aria-invalid={!!fieldErrors.quantity}
            />
            {fieldErrors.quantity && <p className="text-[12px] text-danger-ink">{fieldErrors.quantity}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="par" className="text-[12px] text-ink/70 font-medium">Par level</label>
            <input
              id="par"
              type="number"
              min="0"
              value={par}
              onChange={(e) => setPar(e.target.value)}
              className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink caret-accent-500 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
                fieldErrors.par ? 'border-danger-edge' : 'border-divider'
              }`}
              aria-invalid={!!fieldErrors.par}
            />
            {fieldErrors.par && <p className="text-[12px] text-danger-ink">{fieldErrors.par}</p>}
          </div>
        </div>

        {/* Event date + Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="event_date" className="text-[12px] text-ink/70 font-medium">Event date</label>
            <input
              id="event_date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink caret-accent-500 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
                fieldErrors.event_date ? 'border-danger-edge' : 'border-divider'
              }`}
              aria-invalid={!!fieldErrors.event_date}
            />
            {fieldErrors.event_date && <p className="text-[12px] text-danger-ink">{fieldErrors.event_date}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="location" className="text-[12px] text-ink/70 font-medium">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Shelf B3"
              className="w-full px-4 py-2 bg-surface border border-divider rounded-pill text-base text-ink caret-accent-500 placeholder:text-ink/45 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus:outline-none"
          >
            {submitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
          <Link
            to="/inventory"
            className="px-4 py-2 text-sm font-display font-bold rounded-pill border border-divider text-ink hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
