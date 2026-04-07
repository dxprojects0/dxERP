import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addTicket, deleteTicket, updateStage, updateTicket } from '../features/repairSlice';
import { deductStock } from '../features/inventorySlice';
import { JobTicket, PaymentMode, RepairStage } from '../types';
import Drawer from '../components/Drawer';
import { Plus, Search, Share2, Trash2 } from 'lucide-react';
import { shareData } from '../utils/share';

const STAGES: RepairStage[] = ['Received', 'Diagnose', 'In Process', 'Ready', 'Delivered'];

const RepairJobs: React.FC = () => {
  const dispatch = useDispatch();
  const tickets = useSelector((state: RootState) => state.repairs.tickets);
  const inventory = useSelector((state: RootState) => state.inventory.items);
  const shopName = useSelector((state: RootState) => state.config.shopName);

  const [isOpen, setIsOpen] = useState(false);
  const [partQty, setPartQty] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');

  const [newJob, setNewJob] = useState({
    customerName: '',
    customerPhone: '',
    category: 'Mobile',
    brand: '',
    model: '',
    imei: '',
    problem: '',
    estimatedCost: 0,
    accessories: {
      charger: false,
      box: false,
      sim: false,
    },
  });

  const totals = useMemo(() => {
    const paid = tickets.filter((t) => t.paid).reduce((sum, t) => sum + (t.finalAmount || t.estimatedCost), 0);
    const unpaid = tickets.filter((t) => !t.paid).reduce((sum, t) => sum + (t.finalAmount || t.estimatedCost), 0);
    return { paid, unpaid };
  }, [tickets]);

  const normalizedQuery = search.trim().toLowerCase();
  const filteredTickets = useMemo(() => {
    if (!normalizedQuery) return tickets;
    return tickets.filter((ticket) =>
      [
        ticket.id,
        ticket.customerName,
        ticket.customerPhone,
        ticket.device?.brand,
        ticket.device?.model,
        ticket.device?.imei,
        ticket.problem,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [tickets, normalizedQuery]);

  const createJob = (e: React.FormEvent) => {
    e.preventDefault();
    const accessories = Object.entries(newJob.accessories)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const ticket: JobTicket = {
      id: `JOB-${Date.now().toString().slice(-6)}`,
      stage: 'Received',
      customerName: newJob.customerName,
      customerPhone: newJob.customerPhone,
      device: {
        category: newJob.category,
        brand: newJob.brand,
        model: newJob.model,
        imei: newJob.imei,
      },
      problem: newJob.problem,
      estimatedCost: Number(newJob.estimatedCost) || 0,
      paid: false,
      paymentStatus: 'Unpaid',
      paymentMode: 'Cash',
      createdAt: new Date().toISOString(),
      accessories,
      partsUsed: [],
    };

    dispatch(addTicket(ticket));
    setIsOpen(false);
    setNewJob({
      customerName: '',
      customerPhone: '',
      category: 'Mobile',
      brand: '',
      model: '',
      imei: '',
      problem: '',
      estimatedCost: 0,
      accessories: { charger: false, box: false, sim: false },
    });
  };

  const addPartToTicket = (ticket: JobTicket, partId: string) => {
    const part = inventory.find((i) => i.id === partId);
    if (!part) return;
    const qty = Math.max(1, partQty[ticket.id] || 1);
    dispatch(deductStock({ id: partId, quantity: qty }));
    dispatch(
      updateTicket({
        ...ticket,
        stage: 'In Process',
        partsUsed: [...(ticket.partsUsed || []), { name: part.name, cost: part.costPrice, quantity: qty }],
      }),
    );
  };

  const stageShareMessage = (job: JobTicket) => {
    if (job.stage === 'Diagnose' || job.stage === 'Diagnosing') {
      return `Hello ${job.customerName}\nYour device (${job.device.brand} ${job.device.model}) is under diagnosis.\nEstimated cost: ₹ ${job.estimatedCost}\n- ${shopName || 'Repair Shop'}\n${job.customerPhone}`;
    }
    if (job.stage === 'Ready') {
      return `Good news!\nYour device is ready for pickup.\nModel: ${job.device.brand} ${job.device.model}\nAmount: ₹ ${job.finalAmount || job.estimatedCost}\nStatus: ${job.paid ? 'Paid' : 'Unpaid'}\n- ${shopName || 'Repair Shop'}\n${job.customerPhone}`;
    }
    return `Job ${job.id} is currently in stage: ${job.stage}.\n- ${shopName || 'Repair Shop'}`;
  };

  const updateTicketPayment = (ticket: JobTicket, mode?: PaymentMode) => {
    dispatch(
      updateTicket({
        ...ticket,
        paid: !ticket.paid,
        paymentStatus: !ticket.paid ? 'Paid' : 'Unpaid',
        paymentMode: mode || ticket.paymentMode,
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Job Tickets</h1>
          <p className="text-slate-500">Mini workflow: Received to Diagnose to In Process to Ready to Delivered.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="px-5 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2">
          <Plus size={16} /> New Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-4">Paid: <span className="font-black">₹ {totals.paid}</span></div>
        <div className="bg-white border rounded-xl p-4">Unpaid: <span className="font-black">₹ {totals.unpaid}</span></div>
        <div className="bg-white border rounded-xl p-4">Open Jobs: <span className="font-black">{tickets.filter((t) => t.stage !== 'Delivered').length}</span></div>
      </div>

      <div className="bg-white border rounded-xl p-3 flex items-center gap-2">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, customer, phone, model, or IMEI"
          className="w-full outline-none text-sm"
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-[320px] bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="font-black text-xs uppercase text-slate-500 mb-3">{stage} ({filteredTickets.filter((t) => t.stage === stage).length})</div>
            <div className="space-y-3">
              {filteredTickets
                .filter((t) => t.stage === stage)
                .map((job) => (
                  <div key={job.id} className="bg-white border rounded-xl p-3 space-y-2">
                    <div className="flex justify-between">
                      <div className="text-xs text-slate-500">{job.id}</div>
                      <button className="text-red-500" onClick={() => dispatch(deleteTicket(job.id))}><Trash2 size={14} /></button>
                    </div>
                    <div className="font-bold">{job.device.category} | {job.device.brand} {job.device.model}</div>
                    <div className="text-xs text-slate-600">IMEI/Serial: {job.device.imei || '-'}</div>
                    <div className="text-sm text-slate-700">{job.problem}</div>
                    <div className="text-xs text-slate-500">Customer: {job.customerName} ({job.customerPhone})</div>

                    <select className="w-full border rounded p-1 text-sm" value={job.stage} onChange={(e) => dispatch(updateStage({ id: job.id, stage: e.target.value as RepairStage }))}>
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {(job.stage === 'Diagnose' || job.stage === 'Diagnosing') && (
                      <div className="space-y-1">
                        <input
                          className="w-full border rounded p-1 text-sm"
                          placeholder="Diagnosis notes"
                          value={job.diagnosisNotes || ''}
                          onChange={(e) => dispatch(updateTicket({ ...job, diagnosisNotes: e.target.value }))}
                        />
                        <input
                          type="number"
                          className="w-full border rounded p-1 text-sm"
                          placeholder="Estimated cost"
                          value={job.estimatedCost}
                          onChange={(e) => dispatch(updateTicket({ ...job, estimatedCost: Number(e.target.value) || 0 }))}
                        />
                        <label className="text-xs flex items-center gap-1">
                          <input type="checkbox" checked={!!job.approvalRequired} onChange={(e) => dispatch(updateTicket({ ...job, approvalRequired: e.target.checked }))} /> Approval required
                        </label>
                      </div>
                    )}

                    {job.stage === 'In Process' && (
                      <div className="space-y-1">
                        <input
                          className="w-full border rounded p-1 text-sm"
                          placeholder="Technician name"
                          value={job.technician || ''}
                          onChange={(e) => dispatch(updateTicket({ ...job, technician: e.target.value }))}
                        />
                        <div className="flex gap-1">
                          <select className="flex-1 border rounded p-1 text-sm" onChange={(e) => addPartToTicket(job, e.target.value)} defaultValue="">
                            <option value="" disabled>Add part</option>
                            {(inventory || []).map((item) => (
                              <option key={item.id} value={item.id}>{item.name} (stock {item.quantity})</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            className="w-16 border rounded p-1 text-sm"
                            value={partQty[job.id] || 1}
                            onChange={(e) => setPartQty((prev) => ({ ...prev, [job.id]: Number(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                    )}

                    {job.stage === 'Ready' && (
                      <div className="space-y-1">
                        <input
                          type="number"
                          className="w-full border rounded p-1 text-sm"
                          placeholder="Final amount"
                          value={job.finalAmount || job.estimatedCost}
                          onChange={(e) => dispatch(updateTicket({ ...job, finalAmount: Number(e.target.value) || 0 }))}
                        />
                        <select className="w-full border rounded p-1 text-sm" value={job.paymentMode || 'Cash'} onChange={(e) => dispatch(updateTicket({ ...job, paymentMode: e.target.value as PaymentMode }))}>
                          <option>Cash</option>
                          <option>UPI</option>
                          <option>Card</option>
                          <option>Split</option>
                        </select>
                        <button className={`w-full text-xs rounded p-1 font-bold ${job.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} onClick={() => updateTicketPayment(job)}>
                          {job.paid ? 'Paid' : 'Unpaid'}
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="flex-1 border rounded p-1 text-xs" onClick={() => shareData('Job Update', stageShareMessage(job))}><Share2 size={12} className="inline mr-1" /> Share</button>
                      {job.stage === 'Delivered' && <div className="flex-1 text-center text-xs p-1 bg-slate-200 rounded">Locked</div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Drawer title="Create Repair Job" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={createJob} className="space-y-3">
          <input required className="w-full border rounded p-2" placeholder="Customer name" value={newJob.customerName} onChange={(e) => setNewJob({ ...newJob, customerName: e.target.value })} />
          <input required className="w-full border rounded p-2" placeholder="Phone" value={newJob.customerPhone} onChange={(e) => setNewJob({ ...newJob, customerPhone: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <select className="w-full border rounded p-2" value={newJob.category} onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}>
              <option>Mobile</option>
              <option>Laptop</option>
              <option>TV</option>
            </select>
            <input className="w-full border rounded p-2" placeholder="Brand" value={newJob.brand} onChange={(e) => setNewJob({ ...newJob, brand: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="w-full border rounded p-2" placeholder="Model" value={newJob.model} onChange={(e) => setNewJob({ ...newJob, model: e.target.value })} />
            <input className="w-full border rounded p-2" placeholder="IMEI / Serial" value={newJob.imei} onChange={(e) => setNewJob({ ...newJob, imei: e.target.value })} />
          </div>
          <textarea required className="w-full border rounded p-2" placeholder="Problem description" value={newJob.problem} onChange={(e) => setNewJob({ ...newJob, problem: e.target.value })} />
          <input type="number" min="0" className="w-full border rounded p-2" placeholder="Estimated cost" value={newJob.estimatedCost} onChange={(e) => setNewJob({ ...newJob, estimatedCost: Number(e.target.value) || 0 })} />
          <div className="text-xs text-slate-500">Accessories received</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {(Object.entries(newJob.accessories) || []).map(([name, checked]) => (
              <label key={name} className="flex items-center gap-1">
                <input type="checkbox" checked={checked} onChange={(e) => setNewJob({ ...newJob, accessories: { ...newJob.accessories, [name]: e.target.checked } })} /> {name}
              </label>
            ))}
          </div>
          <button className="w-full bg-primary text-white py-2 rounded font-bold">Create Job</button>
        </form>
      </Drawer>
    </div>
  );
};

export default RepairJobs;
