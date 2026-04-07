import React, { useMemo, useState } from 'react';
import { Check, Phone, Plus, Search, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addAppointment, updateAppointmentStatus } from '../features/businessSlice';
import Drawer from '../components/Drawer';

const Appointments: React.FC = () => {
  const dispatch = useDispatch();
  const appointments = useSelector((state: RootState) => state.business.appointments);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '' });

  const filtered = useMemo(() => {
    const token = search.trim().toLowerCase();
    if (!token) return appointments;
    return appointments.filter((appointment) =>
      [appointment.patientName, appointment.patientPhone, appointment.date, appointment.time].some((field) =>
        String(field || '').toLowerCase().includes(token),
      ),
    );
  }, [appointments, search]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      addAppointment({
        id: `APP-${Date.now()}`,
        patientName: form.name.trim(),
        patientPhone: form.phone.trim(),
        date: form.date,
        time: form.time,
        status: 'Booked',
      }),
    );
    setForm({ name: '', phone: '', date: '', time: '' });
    setIsOpen(false);
  };

  return (
    <div className="space-y-5 pb-20">
      <section className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-black">Appointments</h1>
          <p className="text-sm text-subtle">Simple appointment workflow for clinic visits.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded-xl bg-primary-app text-white font-semibold inline-flex items-center gap-2">
          <Plus size={15} /> New Booking
        </button>
      </section>

      <section className="bg-surface border border-app rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 border border-app rounded-xl px-3 py-2">
          <Search size={15} className="text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or phone"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        <div className="space-y-2 max-h-[62vh] overflow-y-auto">
          {filtered.map((appointment) => (
            <div key={appointment.id} className="border border-app rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{appointment.patientName}</p>
                  <p className="text-xs text-subtle inline-flex items-center gap-1"><Phone size={12} /> {appointment.patientPhone}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  appointment.status === 'Booked'
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : appointment.status === 'Visited'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                }`}>{appointment.status}</span>
              </div>
              <p className="text-xs text-subtle">{appointment.date} • {appointment.time}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => dispatch(updateAppointmentStatus({ id: appointment.id, status: 'Visited' }))}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-1"
                >
                  <Check size={13} /> Visited
                </button>
                <button
                  onClick={() => dispatch(updateAppointmentStatus({ id: appointment.id, status: 'Cancelled' }))}
                  className="px-3 py-2 rounded-lg border border-[var(--danger)] text-[color:var(--danger)] text-sm font-semibold inline-flex items-center justify-center gap-1"
                >
                  <X size={13} /> Cancel
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-subtle py-2">No appointments found.</p>}
        </div>
      </section>

      <Drawer title="Book Appointment" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={handleAdd} className="space-y-3">
          <input required placeholder="Patient name" className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Phone number" className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input required type="date" className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input required type="time" className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-primary-app text-white py-2.5 rounded-xl font-semibold">Confirm Booking</button>
        </form>
      </Drawer>
    </div>
  );
};

export default Appointments;
