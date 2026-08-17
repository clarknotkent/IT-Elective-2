import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { getIngredients, createIngredient, updateIngredient } from '../../api/client';
import { INGREDIENT_TYPES } from '../../types';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface FieldErrors {
  name?: string;
  type?: string;
}

export default function IngredientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [name, setName] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    if (!isEdit || !id) return;
    async function load() {
      const { data } = await getIngredients();
      if (data) {
        const ing = data.find((i) => i.id === Number(id));
        if (ing) {
          setName(ing.name);
          setType(ing.ingredient_type);
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
      if (/name/i.test(part)) errs.name = part;
      else if (/type/i.test(part)) errs.type = part;
      else errs.name = part; // fallback
    }
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    const payload = { name: name.trim(), ingredient_type: type };

    const res = isEdit && id
      ? await updateIngredient(id, payload)
      : await createIngredient(payload);

    if (res.error) {
      setFieldErrors(parseApiErrors(res.error));
      setSubmitting(false);
    } else {
      showToast(isEdit ? 'Ingredient updated' : 'Ingredient created');
      navigate('/ingredients');
    }
  };

  const errorCount = Object.keys(fieldErrors).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      {/* Back button */}
      <Link
        to="/ingredients"
        className="inline-flex items-center gap-1 text-sm font-display font-bold text-ink/70 hover:text-ink rounded-pill self-start px-2 py-1 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
      >
        <ChevronLeft size={16} /> Ingredient catalog
      </Link>

      <h1 className="font-display text-3xl font-bold text-ink">
        {isEdit ? 'Edit ingredient' : 'Add ingredient'}
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
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="ing-name" className="text-[12px] text-ink/70 font-medium">Name</label>
          <input
            id="ing-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vodka"
            className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink caret-accent-500 placeholder:text-ink/45 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
              fieldErrors.name ? 'border-danger-edge' : 'border-divider'
            }`}
            aria-invalid={!!fieldErrors.name}
          />
          {fieldErrors.name && <p className="text-[12px] text-danger-ink">{fieldErrors.name}</p>}
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label htmlFor="ing-type" className="text-[12px] text-ink/70 font-medium">Type</label>
          <select
            id="ing-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
              fieldErrors.type ? 'border-danger-edge' : 'border-divider'
            }`}
            aria-invalid={!!fieldErrors.type}
          >
            <option value="">Select type…</option>
            {INGREDIENT_TYPES.map((t) => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </select>
          {fieldErrors.type && <p className="text-[12px] text-danger-ink">{fieldErrors.type}</p>}
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
            to="/ingredients"
            className="px-4 py-2 text-sm font-display font-bold rounded-pill border border-divider text-ink hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
