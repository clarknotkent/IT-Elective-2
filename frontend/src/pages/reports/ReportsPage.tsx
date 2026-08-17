import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { getDashboard, getReportUrl } from '../../api/client';
import type { DashboardStats } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getDashboard();
      if (data) setStats(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Reports</h1>
        <p className="text-base text-ink/70 mt-1">Download and preview inventory reports.</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info card */}
        <div className="bg-surface border border-divider rounded-xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-100 text-accent-700 grid place-items-center">
            <FileText size={22} />
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-ink">Inventory snapshot</h2>
            <p className="text-sm text-ink/70 mt-1">
              A PDF report of all inventory items, including current stock levels and par values.
              Low-stock items are flagged.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink/55">Rows</dt>
            <dd className="text-ink font-medium tabular-nums">{stats?.inventory_count ?? '—'}</dd>
            <dt className="text-ink/55">Flagged</dt>
            <dd className="text-ink font-medium tabular-nums">{stats?.low_stock_count ?? '—'}</dd>
            <dt className="text-ink/55">Generated</dt>
            <dd className="text-ink font-medium">{today}</dd>
            <dt className="text-ink/55">Format</dt>
            <dd className="text-ink font-medium">PDF</dd>
          </dl>

          <a
            href={getReportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-display font-bold rounded-pill bg-accent-500 text-bg hover:bg-accent-600 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus:outline-none mt-2"
          >
            <Download size={15} /> Download PDF
          </a>
        </div>

        {/* Preview card */}
        <div className="flex flex-col gap-2">
          <div className="bg-white border border-divider rounded-md p-6 font-mono text-xs text-ink/80 leading-relaxed overflow-x-auto whitespace-pre">
{`┌─────────────────────────────────────────────────┐
│        BEVANDA MOBILE BAR – INVENTORY REPORT    │
│        Generated: ${today.padEnd(28)}│
├────────────────────┬──────┬──────┬──────────────┤
│ Product            │  Qty │  Par │ Status       │
├────────────────────┼──────┼──────┼──────────────┤
│ Vodka              │   12 │   10 │ OK           │
│ Triple Sec         │    2 │    8 │ ⚠ LOW        │
│ Fresh Limes        │    5 │   15 │ ⚠ LOW        │
│ Simple Syrup       │   20 │   10 │ OK           │
│ Tonic Water        │    8 │    6 │ OK           │
│ ...                │  ... │  ... │ ...          │
├────────────────────┴──────┴──────┴──────────────┤
│ Total: ${String(stats?.inventory_count ?? 0).padEnd(4)} items   Flagged: ${String(stats?.low_stock_count ?? 0).padEnd(14)}│
└─────────────────────────────────────────────────┘`}
          </div>
          <p className="text-[12px] text-ink/55">
            This is an approximate preview. The actual PDF may differ in layout.
          </p>
        </div>
      </div>
    </div>
  );
}
