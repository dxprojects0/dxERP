import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Modal from '../components/Modal';

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

            <pre className="text-xs bg-app/60 border border-app rounded-xl p-3 overflow-auto whitespace-pre-wrap break-words">
              {JSON.stringify(active.meta, null, 2)}
            </pre>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Bills;
