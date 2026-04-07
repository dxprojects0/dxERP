import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { shareData } from '../utils/share';
import { printHtmlDocument } from '../utils/print';

const DailyReports: React.FC = () => {
  const invoices = useSelector((state: RootState) => state.pos.invoices);
  const inventory = useSelector((state: RootState) => state.inventory.items);

  const today = new Date().toISOString().slice(0, 10);

  const todayInvoices = useMemo(() => invoices.filter((i) => i.date.slice(0, 10) === today), [invoices, today]);

  const todaySales = todayInvoices.reduce((sum, i) => sum + i.total, 0);
  const paid = todayInvoices.filter((i) => i.paid).reduce((sum, i) => sum + i.total, 0);
  const unpaid = todaySales - paid;

  const modeTotals = todayInvoices.reduce(
    (acc, inv) => {
      acc[inv.paymentMode] = (acc[inv.paymentMode] || 0) + inv.total;
      return acc;
    },
    {} as Record<string, number>,
  );

  const itemMap: Record<string, number> = {};
  todayInvoices.forEach((inv) => inv.items.forEach((it) => (itemMap[it.name] = (itemMap[it.name] || 0) + it.quantity)));
  const topItems = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const profitSnapshot = todayInvoices.reduce((sum, inv) => {
    return (
      sum +
      inv.items.reduce((lineSum, line) => {
        const product = inventory.find((p) => p.name === line.name);
        const cost = product ? product.costPrice * line.quantity : 0;
        const revenue = line.price * line.quantity;
        return lineSum + (revenue - cost);
      }, 0)
    );
  }, 0);

  const downloadReport = () => {
    const modeRows = ['Cash', 'UPI', 'Card', 'Split']
      .map((mode) => `<tr><td style="padding:6px 0;">${mode}</td><td style="text-align:right;">Rs ${modeTotals[mode] || 0}</td></tr>`)
      .join('');
    const itemRows = topItems.length
      ? topItems.map(([name, qty]) => `<tr><td style="padding:6px 0;">${name}</td><td style="text-align:right;">${qty}</td></tr>`).join('')
      : '<tr><td colspan="2" style="padding:6px 0;">No sales today.</td></tr>';

    printHtmlDocument(
      `Daily Report ${today}`,
      `
          <h1 style="margin:0 0 6px;">Daily Report</h1>
          <p style="margin:0 0 18px; color:#64748b;">Date: ${today}</p>
          <section style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:14px;">
            <h3 style="margin:0 0 10px;">Summary</h3>
            <p style="margin:4px 0;">Total Sales: <strong>Rs ${todaySales}</strong></p>
            <p style="margin:4px 0;">Paid: <strong>Rs ${paid}</strong></p>
            <p style="margin:4px 0;">Unpaid: <strong>Rs ${unpaid}</strong></p>
            <p style="margin:4px 0;">Profit Snapshot: <strong>Rs ${Math.round(profitSnapshot)}</strong></p>
          </section>
          <section style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px;">
              <h3 style="margin:0 0 10px;">Payment Modes</h3>
              <table style="width:100%">${modeRows}</table>
            </div>
            <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px;">
              <h3 style="margin:0 0 10px;">Top Items</h3>
              <table style="width:100%">${itemRows}</table>
            </div>
          </section>
      `,
    );
  };

  const shareReport = () => {
    const text = `*Daily Report* (${today})
Sales: Rs ${todaySales}
Paid: Rs ${paid}
Unpaid: Rs ${unpaid}
Profit Snapshot: Rs ${Math.round(profitSnapshot)}
Top Items: ${topItems.map((t) => `${t[0]}(${t[1]})`).join(', ') || '-'}`;
    shareData('Daily Report', text);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Daily Reports</h1>
          <p className="text-slate-500">End-of-day clarity in one screen.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-xl" onClick={downloadReport}>Download</button>
          <button className="px-4 py-2 bg-primary text-white rounded-xl" onClick={shareReport}>Share</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4">Today Sales <div className="text-2xl font-black">₹ {todaySales}</div></div>
        <div className="bg-white border rounded-2xl p-4">Paid vs Unpaid <div className="text-sm mt-1">Paid ₹ {paid} | Unpaid ₹ {unpaid}</div></div>
        <div className="bg-white border rounded-2xl p-4">Profit Snapshot <div className="text-2xl font-black">₹ {Math.round(profitSnapshot)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black mb-2">Payment Modes</h3>
          <div className="space-y-2 text-sm">
            {['Cash', 'UPI', 'Card', 'Split'].map((m) => (
              <div key={m} className="flex justify-between"><span>{m}</span><span className="font-bold">₹ {modeTotals[m] || 0}</span></div>
            ))}
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black mb-2">Top Items / Services</h3>
          <div className="space-y-2 text-sm">
            {topItems.length === 0 && <div className="text-slate-400">No sales today.</div>}
            {topItems.map(([name, qty]) => (
              <div key={name} className="flex justify-between"><span>{name}</span><span className="font-bold">{qty}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReports;
