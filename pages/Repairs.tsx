
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { addTicket, updateTicketStatus, updatePaymentStatus } from '../features/repairSlice';
import { addCustomer } from '../features/customerSlice';
import { Plus, Search, User, Clock, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import Drawer from '../components/Drawer';
import { RepairStatus, JobTicket } from '../types';

const Repairs: React.FC = () => {
  const dispatch = useDispatch();
  const repairs = useSelector((state: RootState) => state.repairs.tickets);
  const customers = useSelector((state: RootState) => state.customers.list);
  
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  
  // Forms state
  const [newTicket, setNewTicket] = useState({
    customerId: '', deviceName: '', problemDescription: '', estimatedCost: 0, status: 'Received' as RepairStatus, paymentStatus: 'Unpaid' as 'Paid' | 'Unpaid'
  });
  
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addCustomer(newCustomer));
    setNewCustomer({ name: '', email: '', phone: '' });
    setIsCustomerDrawerOpen(false);
  };

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if(newTicket.customerId === 'add-new') return;
    
    const customer = customers.find(c => c.id === newTicket.customerId);
    
    // Construct a full JobTicket object that satisfies the unified interface
    const ticket: JobTicket = {
      id: `rep-${Date.now()}`,
      stage: newTicket.status,
      status: newTicket.status,
      customerId: newTicket.customerId,
      deviceName: newTicket.deviceName,
      problemDescription: newTicket.problemDescription,
      estimatedCost: newTicket.estimatedCost,
      paymentStatus: newTicket.paymentStatus,
      paid: newTicket.paymentStatus === 'Paid',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      customerName: customer?.name || 'Unknown',
      customerPhone: customer?.phone || '',
      device: {
        category: 'Repair',
        brand: '',
        model: newTicket.deviceName,
        imei: ''
      },
      problem: newTicket.problemDescription,
      accessories: [],
      partsUsed: [],
      createdAt: new Date().toISOString()
    };
    
    dispatch(addTicket(ticket));
    
    setNewTicket({ customerId: '', deviceName: '', problemDescription: '', estimatedCost: 0, status: 'Received', paymentStatus: 'Unpaid' });
    setIsTicketDrawerOpen(false);
  };

  // Kanban Columns
  const columns: { status: RepairStatus, color: string }[] = [
    { status: 'Received', color: 'bg-gray-100 border-gray-200' },
    { status: 'Diagnosing', color: 'bg-blue-50 border-blue-200' },
    { status: 'In Progress', color: 'bg-yellow-50 border-yellow-200' },
    { status: 'Ready', color: 'bg-green-50 border-green-200' },
    { status: 'Delivered', color: 'bg-slate-100 border-slate-200' }
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Repair Pipeline</h1>
        <button 
          onClick={() => setIsTicketDrawerOpen(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-[1000px] h-full pb-4">
          {columns.map(col => {
            const columnTickets = repairs.filter(r => (r.status || r.stage) === col.status);
            return (
              <div key={col.status} className={`flex-1 min-w-[280px] rounded-xl border ${col.color} p-4 flex flex-col`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-700">{col.status}</h3>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                    {columnTickets.length}
                  </span>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                  {columnTickets.map(ticket => {
                    const customer = customers.find(c => c.id === ticket.customerId) || customers.find(c => c.name === ticket.customerName);
                    return (
                      <div key={ticket.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-gray-400">#{ticket.id.slice(-4)}</span>
                          <select 
                            value={ticket.status || ticket.stage}
                            onChange={(e) => dispatch(updateTicketStatus({ id: ticket.id, status: e.target.value as RepairStatus }))}
                            className="text-xs border rounded px-1 py-0.5 bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {columns.map(c => <option key={c.status} value={c.status}>{c.status}</option>)}
                          </select>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{ticket.deviceName || ticket.device.model}</h4>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ticket.problemDescription || ticket.problem}</p>
                        
                        {customer && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                            <User size={12} /> {customer.name}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                          <span className="font-semibold text-sm">${ticket.estimatedCost}</span>
                          <button
                            onClick={() => dispatch(updatePaymentStatus({ 
                              id: ticket.id, 
                              status: (ticket.paymentStatus || (ticket.paid ? 'Paid' : 'Unpaid')) === 'Paid' ? 'Unpaid' : 'Paid' 
                            }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                              (ticket.paymentStatus || (ticket.paid ? 'Paid' : 'Unpaid')) === 'Paid' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-red-100 text-red-700 border-red-200'
                            }`}
                          >
                            {ticket.paymentStatus || (ticket.paid ? 'Paid' : 'Unpaid')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Ticket Drawer */}
      <Drawer title="Create Repair Ticket" isOpen={isTicketDrawerOpen} onClose={() => setIsTicketDrawerOpen(false)}>
        <form onSubmit={handleAddTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              required
              value={newTicket.customerId}
              onChange={(e) => {
                if (e.target.value === 'add-new') {
                  setIsCustomerDrawerOpen(true);
                } else {
                  setNewTicket({ ...newTicket, customerId: e.target.value });
                }
              }}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
              <option value="add-new" className="font-bold text-blue-600">+ Add New Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name / Model</label>
            <input
              type="text"
              required
              value={newTicket.deviceName}
              onChange={e => setNewTicket({ ...newTicket, deviceName: e.target.value })}
              placeholder="e.g. iPhone 13 Pro"
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Problem Description</label>
            <textarea
              required
              rows={3}
              value={newTicket.problemDescription}
              onChange={e => setNewTicket({ ...newTicket, problemDescription: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
            <input
              type="number"
              min="0"
              required
              value={newTicket.estimatedCost}
              onChange={e => setNewTicket({ ...newTicket, estimatedCost: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 font-medium transition-colors mt-6"
          >
            Create Ticket
          </button>
        </form>
      </Drawer>

      {/* Add Customer Drawer */}
      <Drawer title="Add New Customer" isOpen={isCustomerDrawerOpen} onClose={() => setIsCustomerDrawerOpen(false)}>
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newCustomer.name}
              onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={newCustomer.email}
              onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              required
              value={newCustomer.phone}
              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors mt-6"
          >
            Save Customer
          </button>
        </form>
      </Drawer>
    </div>
  );
};

export default Repairs;
