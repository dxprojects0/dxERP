import React, { useMemo, useState } from 'react';
import { CalendarDays, Search, TrendingUp } from 'lucide-react';
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
  const finance = useSelector((state: RootState) => state.finance.transactions || []);
  const inventory = useSelector((state: RootState) => state.inventory.items || []);
  const transactions = useSelector((state: RootState) => state.finance.transactions || []);

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
    const expenses = (finance || [])
      .filter((tx) => tx.type === 'expense' && tx.date?.startsWith(selectedMonth))
      .reduce((s, tx) => s + tx.amount, 0);

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

    const monthSeries = (() => {
      const map = new Map<string, { revenue: number; expense: number; udhaar: number }>();
      (invoices || []).forEach((inv) => {
        const m = (inv.date || '').slice(0, 7);
        if (!m) return;
        const row = map.get(m) || { revenue: 0, expense: 0, udhaar: 0 };
        row.revenue += inv.total;
        if (!inv.paid) row.udhaar += inv.total;
        map.set(m, row);
      });
      (finance || []).forEach((tx) => {
        const m = (tx.date || '').slice(0, 7);
        if (!m) return;
        const row = map.get(m) || { revenue: 0, expense: 0, udhaar: 0 };
        if (tx.type === 'expense') row.expense += tx.amount;
        map.set(m, row);
      });
      return [...map.entries()]
        .sort((a, b) => (a[0] > b[0] ? -1 : 1))
        .slice(0, 6)
        .reverse();
    })();

    return { revenue, udhaar, days, expenses, topProducts, topCategories, monthSeries };
  }, [finance, invoices, inventory, monthInvoices, selectedMonth]);

  const contribution = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 364);

    const byDay = new Map<string, number>();
    invoices.forEach((inv) => {
      if (!inv.date) return;
      const day = inv.date.slice(0, 10);
      const amt = inv.total || 0;
      byDay.set(day, (byDay.get(day) || 0) + amt);
    });
    transactions.forEach((tx) => {
      if (!tx.date) return;
      const day = tx.date.slice(0, 10);
      const amt = tx.type === 'expense' ? -tx.amount : tx.amount;
      byDay.set(day, (byDay.get(day) || 0) + amt);
    });

    const startDay = new Date(start);
    const startWeekDay = startDay.getDay();
    const gridStart = new Date(startDay);
    gridStart.setDate(startDay.getDate() - startWeekDay); // align to Sunday

    const cells: { date: string; value: number; month: number }[] = [];
    for (let d = new Date(gridStart); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      cells.push({ date: key, value: byDay.get(key) || 0, month: d.getMonth() });
    }
    const max = Math.max(...cells.map((c) => Math.abs(c.value)), 1);
    return { cells, max, gridStart };
  }, [invoices, transactions]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <div className="rounded-xl border border-app p-4">
            <p className="text-xs text-subtle">Total Revenue</p>
            <p className="text-2xl font-black text-[color:var(--success)]">₹ {Math.round(summary.revenue)}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-xs text-subtle">Udhaar This Period</p>
            <p className="text-2xl font-black text-[color:var(--danger)]">₹ {Math.round(summary.udhaar)}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-xs text-subtle">Expenses</p>
            <p className="text-2xl font-black text-[#dc2626]">₹ {Math.round(summary.expenses)}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-xs text-subtle">Active Billing Days</p>
            <p className="text-2xl font-black">{summary.days}</p>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-app rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-subtle">
            <TrendingUp size={15} /> Monthly Overview (last 6 months)
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {summary.monthSeries.map(([month, row]) => {
            const max = Math.max(...summary.monthSeries.map(([, r]) => r.revenue + r.expense + r.udhaar), 1);
            const revPct = Math.round(((row.revenue || 0) / max) * 100);
            const expPct = Math.round(((row.expense || 0) / max) * 100);
            const udPct = Math.round(((row.udhaar || 0) / max) * 100);
            return (
              <div key={month} className="space-y-1">
                <div className="flex justify-between text-xs text-subtle">
                  <span>{monthLabel(month)}</span>
                  <span>₹ {Math.round(row.revenue)} rev • ₹ {Math.round(row.expense || 0)} exp • Udhaar ₹ {Math.round(row.udhaar || 0)}</span>
                </div>
                <div className="h-3 rounded-full bg-app/60 overflow-hidden flex">
                  <div className="h-full bg-[color:var(--success)]" style={{ width: `${revPct}%` }} />
                  <div className="h-full bg-[#f97316]" style={{ width: `${expPct}%` }} />
                  <div className="h-full bg-[color:var(--danger)]" style={{ width: `${udPct}%` }} />
                </div>
              </div>
            );
          })}
          {summary.monthSeries.length === 0 && <p className="text-sm text-subtle">No monthly data yet.</p>}
        </div>
      </section>

      <section className="bg-surface border border-app rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-black text-lg">Yearly Transactions Heatmap</h2>
          <p className="text-xs text-subtle">Past 365 days (net: revenue - expenses)</p>
        </div>
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="heatmap-grid">
                {contribution.cells.map(({ date, value }, idx) => {
                  const level = value === 0 ? 0 : Math.min(4, Math.ceil((Math.abs(value) / contribution.max) * 4));
                  return (
                    <div
                      key={date + idx}
                      className="heatmap-cell"
                      data-level={level}
                      title={`${date} • ₹ ${Math.round(value)}`}
                    />
                  );
                })}
              </div>
              <div className="heatmap-legend flex-shrink-0">
                <span>Less</span>
                {[0,1,2,3,4].map((l) => (
                  <span key={l} className="heatmap-cell" data-level={l} style={{ width: 14, height: 14 }} />
                ))}
                <span>More</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-subtle">
              {Array.from(new Set(contribution.cells.map((c) => c.date.slice(0,7)))).map((month) => (
                <span key={month} className="min-w-[38px] text-center border border-app rounded-full px-2 py-1 bg-app/40">
                  {month.slice(5,7)}
                </span>
              ))}
            </div>
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
