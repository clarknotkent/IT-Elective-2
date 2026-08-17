import { useState } from 'react';
import { transferItem } from '../../api/client';
import type { InventoryItem } from '../../types';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';

interface TransferDialogProps {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

export default function TransferDialog({ open, item, onClose, onSuccess }: TransferDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [bookingDate, setBookingDate] = useState(getToday());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const validate = (): boolean => {
    if (!item) return false;
    const errs: Record<string, string> = {};
    const qty = Number(quantity);
    if (!quantity || qty <= 0) errs.quantity = 'Quantity must be greater than 0';
    else if (qty > item.quantity) errs.quantity = `Cannot exceed available quantity (${item.quantity})`;
    if (!bookingDate) errs.booking_date = 'Booking date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (!validate()) return;
    setSubmitting(true);

    const { error } = await transferItem(item.id, {
      quantity: Number(quantity),
      booking_date: bookingDate,
    });

    if (error) {
      setErrors({ server: error });
      setSubmitting(false);
    } else {
      showToast('Transferred to preparation inventory');
      setQuantity('');
      setBookingDate(getToday());
      setErrors({});
      onSuccess();
    }
  };

  const handleClose = () => {
    setQuantity('');
    setBookingDate(getToday());
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open && item !== null} onClose={handleClose} ariaLabelledBy="transfer-title">
      {item && (
        <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-ink/55 mb-1">Transfer to preparation</p>
          <h2 id="transfer-title" className="font-display text-xl font-bold text-ink mb-4">
            {item.product_name}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {errors.server && (
              <p className="text-sm text-danger-ink bg-danger-tint border border-danger-edge p-3 rounded-md">{errors.server}</p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="transfer-qty" className="text-[12px] text-ink/70 font-medium">
                Quantity (max: {item.quantity})
              </label>
              <input
                id="transfer-qty"
                type="number"
                min="1"
                max={item.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink caret-accent-500 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
                  errors.quantity ? 'border-danger-edge' : 'border-divider'
                }`}
                aria-invalid={!!errors.quantity}
              />
              {errors.quantity && <p className="text-[12px] text-danger-ink">{errors.quantity}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="booking-date" className="text-[12px] text-ink/70 font-medium">
                Booking date
              </label>
              <input
                id="booking-date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className={`w-full px-4 py-2 bg-surface border rounded-pill text-base text-ink caret-accent-500 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20 ${
                  errors.booking_date ? 'border-danger-edge' : 'border-divider'
                }`}
                aria-invalid={!!errors.booking_date}
              />
              {errors.booking_date && <p className="text-[12px] text-danger-ink">{errors.booking_date}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-display font-bold rounded-pill border border-divider text-ink hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-display font-bold rounded-pill bg-transfer-ink text-bg hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus:outline-none"
              >
                {submitting ? 'Transferring…' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
