import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import { Activity, Package, ArrowLeftRight, Calendar, List as ListIcon, FileText, Menu, X, Martini } from 'lucide-react';
import { ToastProvider } from './context/ToastContext';
import { getDashboard, getPreparation } from './api/client';
import Dashboard from './pages/Dashboard';
import IngredientList from './pages/ingredients/IngredientList';
import IngredientForm from './pages/ingredients/IngredientForm';
import InventoryList from './pages/inventory/InventoryList';
import InventoryForm from './pages/inventory/InventoryForm';
import StockPage from './pages/stock/StockPage';
import PreparationList from './pages/preparation/PreparationList';
import ReportsPage from './pages/reports/ReportsPage';
import NotFound from './pages/NotFound';

interface NavItemDef {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: 'low' | 'transfer';
}

function Sidebar({ lowStockCount, transferCount, onNavClick }: { lowStockCount: number; transferCount: number; onNavClick?: () => void }) {
  const floorItems: NavItemDef[] = [
    { to: '/', label: 'Overview', icon: <Activity size={17} strokeWidth={2.75} /> },
    { to: '/inventory', label: 'Inventory', icon: <Package size={17} strokeWidth={2.75} />, badge: 'low' },
    { to: '/stock', label: 'Stock in/out', icon: <ArrowLeftRight size={17} strokeWidth={2.75} /> },
    { to: '/preparation', label: 'Preparation', icon: <Calendar size={17} strokeWidth={2.75} />, badge: 'transfer' },
  ];

  const backOfficeItems: NavItemDef[] = [
    { to: '/ingredients', label: 'Ingredient catalog', icon: <ListIcon size={17} strokeWidth={2.75} /> },
    { to: '/reports', label: 'Reports', icon: <FileText size={17} strokeWidth={2.75} /> },
  ];

  const renderBadge = (item: NavItemDef, isActive: boolean) => {
    if (item.badge === 'low' && lowStockCount > 0) {
      return (
        <span className={`ml-auto min-w-[22px] text-center px-[7px] py-[2px] rounded-pill text-xs ${isActive ? 'bg-bg/20 text-bg' : 'bg-low-tint text-low-ink'}`}>
          {lowStockCount}
        </span>
      );
    }
    if (item.badge === 'transfer' && transferCount > 0) {
      return (
        <span className={`ml-auto min-w-[22px] text-center px-[7px] py-[2px] rounded-pill text-xs ${isActive ? 'bg-bg/20 text-bg' : 'bg-transfer-tint text-transfer-ink'}`}>
          {transferCount}
        </span>
      );
    }
    return null;
  };

  const renderNavItem = (item: NavItemDef) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={onNavClick}
      className={({ isActive }) =>
        `flex items-center gap-2 w-full py-2 px-3 rounded-pill text-sm text-left transition-colors ${
          isActive
            ? 'bg-accent-500 text-bg font-medium'
            : 'text-ink hover:bg-ink/[0.08]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {item.icon}
          <span>{item.label}</span>
          {renderBadge(item, isActive)}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-3 px-3 py-2 mb-2" onClick={onNavClick}>
        <span className="w-[38px] h-[38px] rounded-full bg-accent-500 grid place-items-center flex-none">
          <Martini size={18} strokeWidth={2.75} className="text-bg" />
        </span>
        <span className="flex flex-col">
          <span className="font-display font-bold text-base text-ink leading-tight">Bevanda</span>
          <span className="text-[11px] text-ink/50 leading-tight">Mobile bar</span>
        </span>
      </Link>

      {/* Floor nav group */}
      <nav className="flex flex-col gap-1 mt-4">
        <span className="px-3 text-[10px] uppercase tracking-wider text-ink/50 font-medium mb-1">Floor</span>
        {floorItems.map(renderNavItem)}
      </nav>

      {/* Back office nav group */}
      <nav className="flex flex-col gap-1 mt-6">
        <span className="px-3 text-[10px] uppercase tracking-wider text-ink/50 font-medium mb-1">Back office</span>
        {backOfficeItems.map(renderNavItem)}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-3 py-3">
        <div className="text-[11px] text-ink/40 leading-tight">Bevanda Inventory</div>
        <div className="text-[11px] text-ink/40 leading-tight">Single user · no sign-in</div>
      </div>
    </div>
  );
}

function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    async function fetchCounts() {
      const [dashRes, prepRes] = await Promise.all([getDashboard(), getPreparation()]);
      if (dashRes.data) setLowStockCount(dashRes.data.low_stock_count);
      if (prepRes.data) setTransferCount(prepRes.data.length);
    }
    fetchCounts();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[248px] flex-none h-screen sticky top-0 p-4 px-3 flex-col border-r border-divider bg-surface">
        <Sidebar lowStockCount={lowStockCount} transferCount={transferCount} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-surface border-b border-divider flex items-center px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-pill text-ink hover:bg-ink/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} strokeWidth={2.75} />
        </button>
        <Link to="/" className="ml-3 font-display font-bold text-base text-ink">Bevanda</Link>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[248px] h-full bg-surface p-4 px-3 flex flex-col shadow-lg overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1 rounded-pill text-ink hover:bg-ink/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              aria-label="Close navigation menu"
            >
              <X size={18} strokeWidth={2.75} />
            </button>
            <Sidebar lowStockCount={lowStockCount} transferCount={transferCount} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 md:p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/add" element={<InventoryForm />} />
            <Route path="/inventory/:id/edit" element={<InventoryForm />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/preparation" element={<PreparationList />} />
            <Route path="/ingredients" element={<IngredientList />} />
            <Route path="/ingredients/add" element={<IngredientForm />} />
            <Route path="/ingredients/:id/edit" element={<IngredientForm />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
