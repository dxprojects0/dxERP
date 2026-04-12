import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Modal from '../components/Modal';
import { printHtmlDocument } from '../utils/print';

type TxKind = 'invoice' | 'expense' | 'income' | 'ledgerDue';

type TxItem = {
  id: string;
  kind: TxKind;
  date: string;
  label: string;
  amount: number;
  meta: Record<string, any>;
};

const asDateValue = (value?: string) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const Bills: React.FC = () => {
  const invoices = useSelector((state: RootState) => state.pos.invoices || []);
  const finance = useSelector((state: RootState) => state.finance.transactions || []);
  const ledger = useSelector((state: RootState) => state.business.ledger || []);
  const shopName = useSelector((state: RootState) => state.config.shopName || 'Your Business');

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | TxKind>('all');
  const [active, setActive] = useState<TxItem | null>(null);

  const transactions = useMemo(() => {
    const billItems: TxItem[] = (invoices || []).map((inv) => ({
      id: inv.id,
      kind: 'invoice',
      date: inv.date,
      label: `Invoice ${inv.id}`,
      amount: inv.total,
      meta: inv,
    }));

    const financeItems: TxItem[] = (finance || []).map((tx) => ({
      id: tx.id,
      kind: tx.type === 'income' ? 'income' : 'expense',
      date: tx.date,
      label: tx.description || tx.category || `Transaction ${tx.id}`,
      amount: tx.type === 'income' ? tx.amount : -tx.amount,
      meta: tx,
    }));

    const ledgerItems: TxItem[] = (ledger || [])
      .map((entry) => ({
        id: entry.id,
        kind: 'ledgerDue' as const,
        date: entry.date,
        label: `Udhaar ${entry.customerName}`,
        amount: Math.max(0, entry.amount - entry.paid),
        meta: entry,
      }))
      .filter((item) => item.amount > 0);

    return [...billItems, ...financeItems, ...ledgerItems].sort((a, b) => asDateValue(b.date) - asDateValue(a.date));
  }, [finance, invoices, ledger]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (kindFilter !== 'all' && tx.kind !== kindFilter) return false;
      if (!q) return true;
      const haystack = `${tx.id} ${tx.label} ${tx.date} ${JSON.stringify(tx.meta)}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [transactions, query, kindFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-24 overflow-x-hidden">
      <section className="bg-surface border border-app rounded-2xl p-4 md:p-5 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Bills & Transactions</h1>
            <p className="text-sm text-subtle">Tap any row to view full details.</p>
          </div>
          <div className="text-xs text-subtle">Total records: {filtered.length}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-2">
          <div className="flex items-center gap-2 border border-app rounded-xl px-3 py-2 bg-app/40">
            <Search size={16} className="text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoice, customer, item, amount..."
              className="w-full min-w-0 bg-transparent outline-none text-sm"
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as 'all' | TxKind)}
            className="border border-app rounded-xl px-3 py-2 bg-transparent text-sm"
          >
            <option value="all">All Types</option>
            <option value="invoice">Invoices</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
            <option value="ledgerDue">Udhaar Due</option>
          </select>
        </div>
      </section>

      <section className="space-y-2 max-h-[68vh] overflow-y-auto overflow-x-hidden pr-0.5">
        {filtered.map((tx) => (
          <button
            key={`${tx.kind}-${tx.id}`}
            onClick={() => setActive(tx)}
            className="w-full bg-surface border border-app rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-subtle">{tx.kind}</p>
              <p className="font-semibold text-sm truncate">{tx.label}</p>
              <p className="text-xs text-subtle truncate">{tx.date}</p>
            </div>
            <p className={`font-black whitespace-nowrap ${tx.amount >= 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
              {tx.amount >= 0 ? '+' : '-'} ₹ {Math.abs(Math.round(tx.amount))}
            </p>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="bg-surface border border-app rounded-xl p-5 text-sm text-subtle text-center">
            No matching transactions.
          </div>
        )}
      </section>

      {active && (
        <Modal
          isOpen={Boolean(active)}
          onClose={() => setActive(null)}
          title="Transaction Details"
          maxWidth="56rem"
          closeOnBackdrop
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-subtle">{active.kind}</p>
              <h3 className="font-black text-xl">{active.label}</h3>
              <p className="text-sm text-subtle mt-1">{active.date}</p>
            </div>

            <div className="rounded-xl border border-app p-3 bg-app/40">
              <p className="text-xs text-subtle">Amount</p>
              <p className={`text-2xl font-black ${active.amount >= 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
                {active.amount >= 0 ? '+' : '-'} ₹ {Math.abs(Math.round(active.amount))}
              </p>
            </div>

            <div className="rounded-xl border border-app p-3 space-y-2">
              <p className="font-semibold text-sm">Customer</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-subtle">
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Name</p>
                  <p className="font-medium text-foreground">{active.meta.customerName || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Contact</p>
                  <p className="font-medium text-foreground">{active.meta.customerPhone || active.meta.customerEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Address</p>
                  <p className="font-medium text-foreground">{active.meta.customerAddress || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Notes</p>
                  <p className="font-medium text-foreground">{active.meta.notes || active.meta.description || '—'}</p>
                </div>
              </div>
            </div>

            {'items' in active.meta && Array.isArray(active.meta.items) && (
              <div className="rounded-xl border border-app p-3">
                <p className="font-semibold text-sm mb-2">Items</p>
                <div className="space-y-1">
                  {active.meta.items.map((item: any, idx: number) => (
                    <div key={`${item.name || 'item'}-${idx}`} className="text-sm text-subtle flex justify-between gap-2">
                      <span className="truncate">{item.name} x{item.quantity}</span>
                      <span className="whitespace-nowrap">₹ {item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-app p-3 space-y-2">
              <p className="font-semibold text-sm">Summary</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-subtle">
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Reference</p>
                  <p className="font-medium text-foreground">{active.meta.id || active.id}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Category</p>
                  <p className="font-medium text-foreground">{active.meta.category || active.meta.type || active.kind}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Payment Status</p>
                  <p className="font-medium text-foreground">{active.meta.status || active.meta.paymentStatus || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide">Recorded By</p>
                  <p className="font-medium text-foreground">{active.meta.user || active.meta.createdBy || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {active.kind === 'invoice' && (
                <button
                  className="px-4 py-2 rounded-lg bg-primary-app text-white font-semibold"
                  onClick={() => {
                    const meta = active.meta || {};
                    const items = Array.isArray(meta.items) ? meta.items : [];
                    const itemRows = items
                      .map(
                        (item: any) => `
                          <tr>
                            <td style="padding:10px;border:1px solid #d7e3f0;">${item.name}</td>
                            <td style="padding:10px;border:1px solid #d7e3f0;text-align:right;">${item.quantity}</td>
                            <td style="padding:10px;border:1px solid #d7e3f0;text-align:right;">₹ ${item.price}</td>
                            <td style="padding:10px;border:1px solid #d7e3f0;text-align:right;">₹ ${item.price * item.quantity}</td>
                          </tr>
                        `,
                      )
                      .join('');

                    const billHtml = `
                      <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; }
                        .wrapper { max-width: 720px; margin: 0 auto; padding: 32px 32px 48px; }
                        .hero { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
                        .hero img { height:46px; width:46px; object-fit:contain; border-radius:8px; }
                        .hero .title { font-weight:700; font-size:16px; margin:0; color:#0f172a; }
                        h1 { text-align:center; margin:24px 0 12px; font-size:22px; }
                        .label { font-weight:600; margin:0 0 4px; font-size:13px; }
                        .section { margin-top:16px; }
                        .table { width:100%; border-collapse:collapse; margin-top:12px; font-size:13px; }
                        .table th { background:#f1f5f9; text-align:left; padding:10px; border:1px solid #d7e3f0; }
                        .table td { padding:10px; border:1px solid #d7e3f0; }
                        .right { text-align:right; }
                        .total { font-weight:800; font-size:16px; text-align:right; margin-top:12px; }
                      </style>
                      <div class="wrapper">
                        <div class="hero">
                          <img src="/favicon.png" alt="Logo" />
                          <div>
                            <p class="title">${shopName}</p>
                            <p style="margin:0;font-size:12px;color:#334155;">Generated by DhandaX ERP Software</p>
                          </div>
                        </div>

                        <h1>Invoice / Bill</h1>

                        <div class="section" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px;">
                          <div><span class="label">Reference</span><div>${meta.id || active.id}</div></div>
                          <div><span class="label">Date</span><div>${new Date(active.date).toLocaleDateString()}</div></div>
                          <div><span class="label">Type</span><div>${active.kind}</div></div>
                          <div><span class="label">Status</span><div>${meta.paid ? 'Paid' : meta.status || meta.paymentStatus || 'Pending'}</div></div>
                          <div><span class="label">Payment Mode</span><div>${meta.paymentMode || meta.paymentMethod || '—'}</div></div>
                        </div>

                        <div class="section">
                          <p class="label">Bill To:</p>
                          <p style="font-weight:700;margin:0 0 2px;">${meta.customerName || '—'}</p>
                          <p style="margin:0 0 2px;">${meta.customerPhone || meta.customerEmail || '—'}</p>
                          <p style="margin:0;">${meta.customerAddress || ''}</p>
                        </div>

                        <table class="table">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th class="right">Quantity</th>
                              <th class="right">Unit Price</th>
                              <th class="right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemRows || `
                              <tr>
                                <td style="padding:10px;border:1px solid #d7e3f0;" colspan="4">No line items recorded.</td>
                              </tr>`}
                          </tbody>
                        </table>

                        <div class="total">Total Amount: ₹${Math.abs(Math.round(active.amount || meta.total || 0))}</div>
                      </div>
                    `;

                    const printed = printHtmlDocument(`Invoice-${active.id}`, billHtml, 720, 1020);
                    if (!printed) {
                      alert('Popup blocked. Allow popups to download the PDF.');
                    }
                  }}
                >
                  Download
                </button>
              )}
              <button
                className="px-4 py-2 rounded-lg border border-app text-foreground font-semibold"
                onClick={async () => {
                  const meta = active.meta || {};
                  const summary = [
                    `Transaction: ${active.label}`,
                    `Date: ${active.date}`,
                    `Type: ${active.kind}`,
                    `Amount: ${active.amount >= 0 ? '+' : '-'}₹${Math.abs(Math.round(active.amount))}`,
                    `Customer: ${meta.customerName || 'N/A'}`,
                    `Contact: ${meta.customerPhone || meta.customerEmail || 'N/A'}`,
                    `Address: ${meta.customerAddress || 'N/A'}`,
                    `Category: ${meta.category || meta.type || active.kind}`,
                    `Status: ${meta.status || meta.paymentStatus || (active.amount >= 0 ? 'Paid/Inflow' : 'Outflow')}`,
                    `Notes: ${meta.notes || meta.description || 'N/A'}`,
                  ].join('\n');
                  if (navigator.share) {
                    await navigator.share({ title: active.label, text: summary });
                  } else {
                    await navigator.clipboard.writeText(summary);
                    alert('Details copied to clipboard.');
                  }
                }}
              >
                Share
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Bills;
