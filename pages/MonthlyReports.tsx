import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from '../store/store';
import { isPaidPlan } from '../utils/plans';

const toMonthKey = (date: Date) => date.toISOString().slice(0, 7);

const MonthlyReports: React.FC = () => {
  const { month } = useParams<{ month: string }>();
  const { plan } = useSelector((state: RootState) => state.config);
  const invoices = useSelector((state: RootState) => state.pos.invoices || []);
  const transactions = useSelector((state: RootState) => state.finance.transactions || []);
  const [selectedMonth, setSelectedMonth] = useState(month || toMonthKey(new Date()));

  const monthlyInvoices = useMemo(
    () => (invoices || []).filter((invoice) => invoice.date?.startsWith(selectedMonth)),
    [selectedMonth, invoices],
  );
  const monthTx = useMemo(
    () => (transactions || []).filter((tx) => tx.date?.startsWith(selectedMonth)),
    [selectedMonth, transactions],
  );

  const revenue = monthlyInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const expenses = monthTx.filter((tx) => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);
  const profit = revenue - expenses;

  if (!isPaidPlan(plan)) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-surface border border-app rounded-2xl p-6 space-y-3">
          <h1 className="text-2xl font-black">Monthly Analytics is a Pro Feature</h1>
          <p className="text-sm text-subtle">Free plan supports daily work. Upgrade to Pro to unlock monthly trends.</p>
          <button className="shimmer-button text-white px-4 py-2 rounded-lg font-semibold opacity-70 cursor-not-allowed">Upgrade to Pro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-surface border border-app rounded-2xl p-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Monthly Overview</h1>
          <p className="text-sm text-subtle">Track revenue, expenses, and profit by month.</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-subtle">Calendar Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block border border-app rounded-lg px-3 py-2 bg-transparent"
          />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-surface border border-app rounded-xl p-4">
          <p className="text-xs text-subtle">Total Revenue</p>
          <p className="text-2xl font-black">? {revenue}</p>
        </div>
        <div className="bg-surface border border-app rounded-xl p-4">
          <p className="text-xs text-subtle">Total Expense</p>
          <p className="text-2xl font-black">? {expenses}</p>
        </div>
        <div className="bg-surface border border-app rounded-xl p-4">
          <p className="text-xs text-subtle">Net ({selectedMonth})</p>
          <p className={`text-2xl font-black ${profit >= 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>? {profit}</p>
        </div>
      </section>

      <div className="bg-surface border border-app rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[color:var(--primary)]/10 text-xs uppercase text-subtle">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {(monthlyInvoices || []).map((invoice) => (
              <tr key={invoice.id}>
                <td className="p-3">{invoice.id}</td>
                <td className="p-3">{new Date(invoice.date).toLocaleString()}</td>
                <td className="p-3 font-bold">? {invoice.total}</td>
              </tr>
            ))}
            {monthlyInvoices.length === 0 && (
              <tr>
                <td className="p-6 text-center text-subtle" colSpan={3}>No billing data for this month.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyReports;

