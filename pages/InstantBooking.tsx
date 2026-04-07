import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addServiceBooking, updateServiceBookingStatus } from '../features/businessSlice';

const InstantBooking: React.FC = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state: RootState) => state.business.serviceBookings);

  const [form, setForm] = useState({ serviceType: '', location: '', date: '', time: '', technician: '' });

  const addBooking = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      addServiceBooking({
        id: `BK-${Date.now().toString().slice(-6)}`,
        ...form,
        status: form.technician ? 'Assigned' : 'Booked',
      }),
    );
    setForm({ serviceType: '', location: '', date: '', time: '', technician: '' });
  };

  const active = useMemo(() => bookings.filter((b) => !['Completed', 'Cancelled'].includes(b.status)).length, [bookings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Instant Booking</h1>
        <p className="text-slate-500">Service type, location, time, technician assignment, and job status.</p>
      </div>

      <div className="bg-white border rounded-2xl p-4">Active Jobs: <span className="font-black">{active}</span></div>

      <form onSubmit={addBooking} className="bg-white border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input required className="border rounded p-2" placeholder="Service type" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} />
        <input required className="border rounded p-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input required type="date" className="border rounded p-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input required type="time" className="border rounded p-2" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        <input className="border rounded p-2" placeholder="Technician" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} />
        <button className="md:col-span-5 bg-primary text-white rounded py-2 font-bold">Create Booking</button>
      </form>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Service</th>
              <th className="p-3">Location</th>
              <th className="p-3">Schedule</th>
              <th className="p-3">Technician</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="p-3">{b.serviceType}</td>
                <td className="p-3">{b.location}</td>
                <td className="p-3">{b.date} {b.time}</td>
                <td className="p-3">{b.technician || '-'}</td>
                <td className="p-3">
                  <select value={b.status} onChange={(e) => dispatch(updateServiceBookingStatus({ id: b.id, status: e.target.value as any }))} className="border rounded p-1 text-sm">
                    <option>Booked</option>
                    <option>Assigned</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No service bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstantBooking;
