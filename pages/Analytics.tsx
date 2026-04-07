import React, { useMemo, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const toMonth = (date: Date) => date.toISOString().slice(0, 7);

const monthLabel = (month: string) => {
  const d = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
};

const Analytics: React.FC = () => {
  const invoices = useSelector((state: RootState) => state.pos.invoices || []);
  const inventory = useSelector((state: RootState) => state.inventory.items || []);

  const currentMonth = toMonth(new Date());
  const [monthInput, setMonthInput] = useState(currentMonth);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState('');

  const monthInvoices = useMemo(
    () =>
      (invoices || []).filter((inv) => {
        if (!inv.date?.startsWith(selectedMonth)) return false;
        if (selectedDate && !inv.date.startsWith(selectedDate)) return false;
        return true;
      }),
    [invoices, selectedMonth, selectedDate],
  );

  const summary = useMemo(() => {
    const revenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const udhaar = monthInvoices.filter((inv) => !inv.paid).reduce((sum, inv) => sum + inv.total, 0);
    const days = new Set(monthInvoices.map((inv) => inv.date?.slice(0, 10)).filter(Boolean)).size;

    const byProduct = new Map<string, { qty: number; revenue: number; category: string }>();
    const byCategory = new Map<string, { qty: number; revenue: number }>();
    const inventoryByName = new Map((inventory || []).map((item) => [item.name.toLowerCase(), item]));

    monthInvoices.forEach((inv) => {
      inv.items.forEach((line) => {
        const key = line.name.toLowerCase();
        const invMatch = inventoryByName.get(key);
        const category = invMatch?.category || 'Uncategorized';
        const product = byProduct.get(line.name) || { qty: 0, revenue: 0, category };
        product.qty += line.quantity;
        product.revenue += line.price * line.quantity;
        product.category = category;
        byProduct.set(line.name, product);

        const categoryRow = byCategory.get(category) || { qty: 0, revenue: 0 };
        categoryRow.qty += line.quantity;
        categoryRow.revenue += line.price * line.quantity;
        byCategory.set(category, categoryRow);
      });
    });

    const topProducts = [...byProduct.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
    const topCategories = [...byCategory.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.revenue - a.revenue);

    return { revenue, udhaar, days, topProducts, topCategories };
  }, [inventory, monthInvoices]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-24 overflow-x-hidden">
      <section className="bg-surface border border-app rounded-2xl p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Analytics</h1>
            <p className="text-sm text-subtle">Search month-wise data from calendar (from year 2026).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_220px_auto] gap-2 mt-4">
          <label className="text-sm">
            <span className="text-xs text-subtle uppercase">Month</span>
            <input
              type="month"
              min="2026-01"
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
              className="mt-1 w-full border border-app rounded-xl px-3 py-2 bg-transparent"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs text-subtle uppercase">Specific Date (optional)</span>
            <input
              type="date"
              min={`${monthInput || '2026-01'}-01`}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 w-full border border-app rounded-xl px-3 py-2 bg-transparent"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={() => setSelectedMonth(monthInput || currentMonth)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-app text-white font-semibold"
            >
              <Search size={15} /> Search Analytics
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-app rounded-2xl p-4 md:p-5">
        <div className="inline-flex items-center gap-2 text-sm text-subtle">
          <CalendarDays size={15} />
          {monthLabel(selectedMonth)} {selectedDate ? `• ${selectedDate}` : ''}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div className="rounded-xl border border-app p-4">
            <p className="text-xs text-subtle">Total Revenue</p>
            <p className="text-2xl font-black text-[color:var(--success)]">₹ {Math.round(summary.revenue)}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-xs text-subtle">Udhaar This Period</p>
            <p className="text-2xl font-black text-[color:var(--danger)]">₹ {Math.round(summary.udhaar)}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-xs text-subtle">Active Billing Days</p>
            <p className="text-2xl font-black">{summary.days}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-surface border border-app rounded-2xl p-4 md:p-5">
          <h2 className="font-black text-lg">Top Selling Products</h2>
          <p className="text-xs text-subtle mt-1">Ranked by quantity sold.</p>
          <div className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
            {summary.topProducts.map((item) => (
              <div key={item.name} className="rounded-xl border border-app px-3 py-2">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-subtle">
                  Category: {item.category} • Qty: {item.qty} • Revenue: ₹ {Math.round(item.revenue)}
                </p>
              </div>
            ))}
            {summary.topProducts.length === 0 && <p className="text-sm text-subtle py-3">No product sales for this selection.</p>}
          </div>
        </div>

        <div className="bg-surface border border-app rounded-2xl p-4 md:p-5">
          <h2 className="font-black text-lg">Category Summary</h2>
          <p className="text-xs text-subtle mt-1">Based on billed product mix.</p>
          <div className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
            {summary.topCategories.map((item) => (
              <div key={item.name} className="rounded-xl border border-app px-3 py-2 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-xs text-subtle">Qty sold: {item.qty}</p>
                </div>
                <p className="font-black text-sm whitespace-nowrap">₹ {Math.round(item.revenue)}</p>
              </div>
            ))}
            {summary.topCategories.length === 0 && <p className="text-sm text-subtle py-3">No category insights for this selection.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
