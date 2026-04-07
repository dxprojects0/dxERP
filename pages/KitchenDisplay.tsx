import React, { useMemo, useState } from 'react';
import { CheckCircle, ChefHat, Flame, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addKitchenOrder, deleteKitchenOrder, updateKitchenStatus } from '../features/businessSlice';
import Modal from '../components/Modal';

const KitchenDisplay: React.FC = () => {
  const dispatch = useDispatch();
  const orders = useSelector((state: RootState) => state.business.kitchenOrders);
  const [tableNo, setTableNo] = useState('');
  const [itemsInput, setItemsInput] = useState('');
  const [confirmDeliverId, setConfirmDeliverId] = useState<string | null>(null);

  const activeCount = useMemo(() => orders.filter((order) => order.status !== 'Delivered').length, [orders]);

  const createOrder = () => {
    if (!tableNo.trim() || !itemsInput.trim()) return;
    const rows = itemsInput
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name) => ({ name, qty: 1 }));
    if (!rows.length) return;

    dispatch(
      addKitchenOrder({
        id: `KOT-${Date.now().toString().slice(-5)}`,
        table: tableNo.trim(),
        items: rows,
        status: 'New',
        startTime: new Date().toISOString(),
      }),
    );
    setItemsInput('');
  };

  const getStatusChip = (status: string) => {
    if (status === 'New') return 'bg-red-50 text-red-700 border-red-100';
    if (status === 'Preparing') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'Ready') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-5 pb-20">
      <section className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-black">Kitchen Display</h1>
          <p className="text-sm text-subtle">Manage kitchen queue from table number and comma-separated items.</p>
        </div>
        <div className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold inline-flex items-center gap-2">
          <ChefHat size={15} /> {activeCount} Active
        </div>
      </section>

      <section className="bg-surface border border-app rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[180px_1fr_160px] gap-2">
        <input
          className="border border-app rounded-xl px-3 py-2 bg-transparent"
          placeholder="Table no (e.g. 5)"
          value={tableNo}
          onChange={(e) => setTableNo(e.target.value)}
        />
        <input
          className="border border-app rounded-xl px-3 py-2 bg-transparent"
          placeholder="Items separated by comma (Burger, Fries, Coffee)"
          value={itemsInput}
          onChange={(e) => setItemsInput(e.target.value)}
        />
        <button onClick={createOrder} className="bg-primary-app text-white rounded-xl px-3 py-2 font-semibold inline-flex items-center justify-center gap-2">
          <Plus size={15} /> Add Order
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => {
          const elapsed = Math.max(0, Math.floor((Date.now() - new Date(order.startTime).getTime()) / 60000));
          return (
            <article key={order.id} className="bg-surface border border-app rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-subtle">Table {order.table}</p>
                  <p className="text-sm text-subtle">{order.id}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusChip(order.status)}`}>{order.status}</span>
              </div>

              <div className="border border-app rounded-xl p-3 space-y-1">
                {order.items.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="text-sm flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-semibold">x{item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-subtle">{elapsed} min elapsed</span>
                <div className="flex gap-2">
                  {order.status === 'New' && (
                    <button
                      onClick={() => dispatch(updateKitchenStatus({ id: order.id, status: 'Preparing' }))}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Flame size={12} /> Preparing
                    </button>
                  )}
                  {order.status === 'Preparing' && (
                    <button
                      onClick={() => dispatch(updateKitchenStatus({ id: order.id, status: 'Ready' }))}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <CheckCircle size={12} /> Ready
                    </button>
                  )}
                  {order.status === 'Ready' && (
                    <button
                      onClick={() => setConfirmDeliverId(order.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                    >
                      Deliver
                    </button>
                  )}
                  {order.status === 'Delivered' && (
                    <button
                      onClick={() => dispatch(deleteKitchenOrder(order.id))}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--danger)] text-[color:var(--danger)] text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {orders.length === 0 && (
        <div className="p-10 text-center text-subtle bg-surface border border-dashed border-app rounded-2xl">
          No kitchen orders yet.
        </div>
      )}

      {confirmDeliverId && (
        <Modal
          isOpen={Boolean(confirmDeliverId)}
          onClose={() => setConfirmDeliverId(null)}
          title="Confirm Delivery"
          maxWidth="24rem"
          closeOnBackdrop={false}
        >
          <div className="space-y-3">
            <p className="text-sm text-subtle">Mark this order as delivered?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  dispatch(updateKitchenStatus({ id: confirmDeliverId, status: 'Delivered' }));
                  setConfirmDeliverId(null);
                }}
                className="px-3 py-2 rounded-xl bg-primary-app text-white text-sm font-semibold"
              >
                Confirm
              </button>
              <button onClick={() => setConfirmDeliverId(null)} className="px-3 py-2 rounded-xl border border-app text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default KitchenDisplay;
