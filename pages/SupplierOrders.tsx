import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addSupplierOrder, updateSupplierOrderStatus } from '../features/businessSlice';
import { stockIn } from '../features/inventorySlice';

const SupplierOrders: React.FC = () => {
  const dispatch = useDispatch();
  const orders = useSelector((state: RootState) => state.business.supplierOrders);
  const inventory = useSelector((state: RootState) => state.inventory.items);

  const [form, setForm] = useState({ supplierName: '', itemSummary: '', totalCost: '', itemId: '', qty: 0 });

  const createOrder = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      addSupplierOrder({
        id: `PO-${Date.now().toString().slice(-5)}`,
        supplierName: form.supplierName,
        itemSummary: form.itemSummary,
        totalCost: Number(form.totalCost) || 0,
        linkedItemId: form.itemId || undefined,
        receivedQty: form.qty || undefined,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      }),
    );
    setForm({ supplierName: '', itemSummary: '', totalCost: '', itemId: '', qty: 0 });
  };

  const markReceived = (id: string, itemId?: string, qty?: number) => {
    dispatch(updateSupplierOrderStatus({ id, status: 'Received' }));
    if (itemId && qty && qty > 0) {
      dispatch(stockIn({ id: itemId, quantity: qty }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Supplier Orders</h1>
        <p className="text-slate-500">Track pending/received orders and auto-update stock on receipt.</p>
      </div>

      <form onSubmit={createOrder} className="bg-white border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input required className="border rounded p-2" placeholder="Supplier" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
        <input required className="border rounded p-2" placeholder="Order items summary" value={form.itemSummary} onChange={(e) => setForm({ ...form, itemSummary: e.target.value })} />
        <input type="number" min="0" required className="border rounded p-2" placeholder="Total cost" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} />
        <select className="border rounded p-2" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
          <option value="">Stock item (optional)</option>
          {inventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input type="number" min="0" className="border rounded p-2" placeholder="Qty on receipt" value={form.qty || ''} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) || 0 })} />
        <button className="md:col-span-5 bg-primary text-white py-2 rounded font-bold">Create Order</button>
      </form>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Supplier</th>
              <th className="p-3">Items</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="p-3">{order.supplierName}</td>
                <td className="p-3">{order.itemSummary}</td>
                <td className="p-3">₹ {order.totalCost}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3">
                  {order.status === 'Pending' ? (
                    <button className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs" onClick={() => markReceived(order.id, order.linkedItemId, order.receivedQty)}>
                      Mark Received
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Completed</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No supplier orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierOrders;
