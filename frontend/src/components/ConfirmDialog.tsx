import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} ariaLabelledBy="confirm-title">
      <div className="w-full max-w-[430px] bg-surface rounded-xl shadow-lg p-6 flex flex-col gap-3">
        <h2 id="confirm-title" className="font-display text-xl font-bold text-ink">
          {title || 'Confirm'}
        </h2>
        <p className="text-base text-ink/70">{message}</p>
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={onCancel} className="px-4 py-2 text-base font-bold font-display rounded-pill border border-divider bg-transparent text-ink hover:bg-ink/[0.07] focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus:outline-none">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-base font-bold font-display rounded-pill bg-danger-edge text-bg hover:bg-clay-700 focus-visible:ring-2 focus-visible:ring-danger-edge focus-visible:ring-offset-2 focus:outline-none">
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
