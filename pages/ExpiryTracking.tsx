import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addExpiryReturn } from '../features/businessSlice';

const ExpiryTracking: React.FC = () => {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.inventory.items);
  const returns = useSelector((state: RootState) => state.business.expiryReturns);

  const now = new Date();

  const withAlerts = useMemo(() => {
    return items
      .filter((i) => i.expiryDate)
      .map((i) => {
        const diffDays = Math.ceil((new Date(i.expiryDate as string).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let alert = '';
        if (diffDays <= 30) alert = '30 days';
        else if (diffDays <= 60) alert = '60 days';
        else if (diffDays <= 90) alert = '90 days';
        return { ...i, diffDays, alert, expired: diffDays < 0 };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [items, now]);

  const logReturn = (item: any) => {
    dispatch(
      addExpiryReturn({
        id: `RET-${Date.now()}`,
        itemName: item.name,
        batchNo: item.batchNo,
        qty: item.quantity,
        returnDate: new Date().toISOString().slice(0, 10),
        supplierName: item.supplier,
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Expiry Tracking</h1>
        <p className="text-slate-500">30/60/90-day alerts, expired-item visibility, and supplier return log.</p>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Batch</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {withAlerts.map((item) => (
              <tr key={item.id} className={item.expired ? 'bg-red-50' : ''}>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.batchNo || '-'}</td>
                <td className="p-3">{item.expiryDate}</td>
                <td className="p-3">
                  {item.expired ? (
                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-bold">Expired</span>
                  ) : item.alert ? (
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 font-bold">Alert {item.alert}</span>
                  ) : (
                    <span className="text-xs text-slate-400">Healthy</span>
                  )}
                </td>
                <td className="p-3">
                  {(item.expired || item.alert) && (
                    <button className="px-2 py-1 rounded text-xs bg-blue-50 text-primary" onClick={() => logReturn(item)}>
                      Return to Supplier
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {withAlerts.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No batch expiry data found in inventory.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h3 className="font-black mb-2">Return Log</h3>
        <div className="space-y-2 text-sm">
          {returns.map((r) => <div key={r.id}>{r.returnDate} | {r.itemName} | Batch {r.batchNo || '-'} | Qty {r.qty} | {r.supplierName || '-'}</div>)}
          {returns.length === 0 && <div className="text-slate-400">No returns logged.</div>}
        </div>
      </div>
    </div>
  );
};

export default ExpiryTracking;
