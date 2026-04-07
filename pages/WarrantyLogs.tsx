import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addWarrantyLog } from '../features/businessSlice';

const WarrantyLogs: React.FC = () => {
  const dispatch = useDispatch();
  const logs = useSelector((state: RootState) => state.business.warrantyLogs);

  const [form, setForm] = useState({
    customerName: '',
    productName: '',
    startDate: '',
    endDate: '',
    coveredParts: '',
    claimHistory: '',
    linkedJobId: '',
  });

  const addLog = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addWarrantyLog({ id: `WAR-${Date.now().toString().slice(-6)}`, ...form, linkedJobId: form.linkedJobId || undefined }));
    setForm({ customerName: '', productName: '', startDate: '', endDate: '', coveredParts: '', claimHistory: '', linkedJobId: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Warranty Logs</h1>
        <p className="text-slate-500">Warranty duration, covered parts, claim history, linked job ticket.</p>
      </div>

      <form onSubmit={addLog} className="bg-white border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <input required className="border rounded p-2" placeholder="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input required className="border rounded p-2" placeholder="Product" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
        <input required type="date" className="border rounded p-2" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <input required type="date" className="border rounded p-2" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <input className="border rounded p-2" placeholder="Covered parts" value={form.coveredParts} onChange={(e) => setForm({ ...form, coveredParts: e.target.value })} />
        <input className="border rounded p-2" placeholder="Linked job ID" value={form.linkedJobId} onChange={(e) => setForm({ ...form, linkedJobId: e.target.value })} />
        <textarea className="md:col-span-2 border rounded p-2" placeholder="Claim history" value={form.claimHistory} onChange={(e) => setForm({ ...form, claimHistory: e.target.value })} />
        <button className="md:col-span-2 bg-primary text-white rounded py-2 font-bold">Save Warranty</button>
      </form>

      <div className="bg-white border rounded-2xl p-4 space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="border rounded p-3">
            <div className="font-bold">{l.customerName} - {l.productName}</div>
            <div className="text-xs text-slate-500">{l.startDate} to {l.endDate} | Job: {l.linkedJobId || '-'}</div>
            <div className="text-sm">Covered: {l.coveredParts || '-'}</div>
            <div className="text-sm">Claims: {l.claimHistory || '-'}</div>
          </div>
        ))}
        {logs.length === 0 && <div className="text-slate-400">No warranty logs.</div>}
      </div>
    </div>
  );
};

export default WarrantyLogs;
