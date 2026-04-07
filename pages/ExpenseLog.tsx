import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addServiceExpense } from '../features/businessSlice';

const ExpenseLog: React.FC = () => {
  const dispatch = useDispatch();
  const expenses = useSelector((state: RootState) => state.business.serviceExpenses);
  const bookings = useSelector((state: RootState) => state.business.serviceBookings);
  const invoices = useSelector((state: RootState) => state.pos.invoices);

  const [form, setForm] = useState({ jobId: '', travelExpense: '', materialCost: '', notes: '' });

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      addServiceExpense({
        id: `EX-${Date.now().toString().slice(-6)}`,
        jobId: form.jobId || undefined,
        date: new Date().toISOString().slice(0, 10),
        travelExpense: Number(form.travelExpense) || 0,
        materialCost: Number(form.materialCost) || 0,
        notes: form.notes || undefined,
      }),
    );
    setForm({ jobId: '', travelExpense: '', materialCost: '', notes: '' });
  };

  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.travelExpense + e.materialCost, 0), [expenses]);
  const totalRevenue = useMemo(() => invoices.reduce((s, i) => s + i.total, 0), [invoices]);
  const profit = totalRevenue - totalExpense;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Expense Log</h1>
        <p className="text-slate-500">Travel + material cost, daily entry, linked job, and quick profit view.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4">Revenue: <span className="font-black">₹ {totalRevenue}</span></div>
        <div className="bg-white border rounded-2xl p-4">Expenses: <span className="font-black">₹ {totalExpense}</span></div>
        <div className="bg-white border rounded-2xl p-4">Profit: <span className="font-black">₹ {profit}</span></div>
      </div>

      <form onSubmit={addExpense} className="bg-white border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <select className="border rounded p-2" value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })}>
          <option value="">Linked Job (optional)</option>
          {bookings.map((b) => <option key={b.id} value={b.id}>{b.id} - {b.serviceType}</option>)}
        </select>
        <input type="number" min="0" required className="border rounded p-2" placeholder="Travel expense" value={form.travelExpense} onChange={(e) => setForm({ ...form, travelExpense: e.target.value })} />
        <input type="number" min="0" required className="border rounded p-2" placeholder="Material cost" value={form.materialCost} onChange={(e) => setForm({ ...form, materialCost: e.target.value })} />
        <input className="border rounded p-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="md:col-span-4 bg-primary text-white rounded py-2 font-bold">Save Expense</button>
      </form>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Job</th>
              <th className="p-3">Travel</th>
              <th className="p-3">Material</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="p-3">{e.date}</td>
                <td className="p-3">{e.jobId || '-'}</td>
                <td className="p-3">₹ {e.travelExpense}</td>
                <td className="p-3">₹ {e.materialCost}</td>
                <td className="p-3 font-bold">₹ {e.travelExpense + e.materialCost}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No expenses logged.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseLog;
