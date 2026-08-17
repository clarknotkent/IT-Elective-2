import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, List, AlertTriangle, ArrowRight } from 'lucide-react';
import { getDashboard, getInventory, getPreparation } from '../api/client';
import type { DashboardStats, InventoryItem, PreparationTransfer } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowItems, setLowItems] = useState<InventoryItem[]>([]);
  const [transfers, setTransfers] = useState<PreparationTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [dashRes, invRes, prepRes] = await Promise.all([
        getDashboard(),
        getInventory(),
        getPreparation(),
      ]);
      if (dashRes.data) setStats(dashRes.data);
      if (invRes.data) setLowItems(invRes.data.filter((i) => i.is_low_stock));
      if (prepRes.data) setTransfers(prepRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Overview</h1>
        <p className="text-base text-ink/70 mt-1">
          Quick look at stock levels, catalog size, and items out for events.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Package size={20} />}
          kicker="On the shelf"
          value={stats?.inventory_count ?? 0}
          subtitle="inventory items tracked"
        />
        <StatCard
          icon={<List size={20} />}
          kicker="Catalog"
          value={stats?.ingredient_count ?? 0}
          subtitle="ingredients registered"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          kicker="Needs restocking"
          value={stats?.low_stock_count ?? 0}
          subtitle="below par level"
          highlight
        />
      </div>

      {/* Restock first */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Restock first</h2>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-display font-bold text-ink rounded-pill hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
          >
            All inventory <ArrowRight size={14} />
          </Link>
        </div>

        {lowItems.length === 0 ? (
          <p className="text-sm text-ink/55">All items are above par — nice work!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowItems.slice(0, 6).map((item) => {
              const shortfall = item.stock - item.quantity;
              return (
                <div
                  key={item.id}
                  className="bg-surface border border-divider rounded-xl p-4 flex flex-col gap-1"
                >
                  <span className="font-semibold text-ink text-sm">{item.product_name}</span>
                  <span className="text-xs text-low-ink font-semibold">
                    {shortfall > 0 ? `${shortfall} below par` : 'At risk'}
                  </span>
                  <span className="text-xs text-ink/55">
                    On hand {item.quantity} · Par {item.stock}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Out for a booking */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Out for a booking</h2>
          <Link
            to="/preparation"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-display font-bold text-ink rounded-pill hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent-500 focus:outline-none"
          >
            Preparation <ArrowRight size={14} />
          </Link>
        </div>

        {transfers.length === 0 ? (
          <p className="text-sm text-ink/55">No items out for events right now.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {transfers.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transfer-tint text-transfer-ink rounded-pill text-sm font-medium"
              >
                {t.product_name} <span className="font-display font-bold">×{t.quantity}</span>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  kicker,
  value,
  subtitle,
  highlight,
}: {
  icon: React.ReactNode;
  kicker: string;
  value: number;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-1 ${
        highlight
          ? 'bg-low-tint border-low-edge'
          : 'bg-surface border-divider'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={highlight ? 'text-low-ink' : 'text-ink/55'}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-ink/55">
          {kicker}
        </span>
      </div>
      <span className="font-display text-[46px] leading-none font-bold text-ink">{value}</span>
      <span className="text-[14px] text-ink/70">{subtitle}</span>
    </div>
  );
}
