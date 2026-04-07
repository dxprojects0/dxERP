import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addStaffShift, updateStaffShift } from '../features/businessSlice';

const StaffRoster: React.FC = () => {
  const dispatch = useDispatch();
  const shifts = useSelector((state: RootState) => state.business.staffShifts);
  const [form, setForm] = useState({ staffName: '', date: '', shift: 'Morning' as 'Morning' | 'Evening' | 'Full Day' });

  const addShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staffName.trim() || !form.date) return;
    dispatch(
      addStaffShift({
        id: `SH-${Date.now().toString().slice(-6)}`,
        staffName: form.staffName.trim(),
        date: form.date,
        shift: form.shift,
        attendance: 'Present',
        overtimeHours: 0,
      }),
    );
    setForm({ staffName: '', date: '', shift: 'Morning' });
  };

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h1 className="text-3xl font-black">Staff Roster</h1>
        <p className="text-sm text-subtle">Create shifts and update attendance with mobile-friendly cards.</p>
      </div>

      <form onSubmit={addShift} className="bg-surface border border-app rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input required className="border border-app rounded-xl px-3 py-2 bg-transparent" placeholder="Staff name" value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} />
        <input required type="date" className="border border-app rounded-xl px-3 py-2 bg-transparent" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <select className="border border-app rounded-xl px-3 py-2 bg-transparent" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value as any })}>
          <option>Morning</option>
          <option>Evening</option>
          <option>Full Day</option>
        </select>
        <button className="bg-primary-app text-white rounded-xl px-3 py-2 font-semibold">Add Shift</button>
      </form>

      <div className="hidden md:block bg-surface border border-app rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs uppercase text-subtle">
            <tr>
              <th className="p-2">Staff</th>
              <th className="p-2">Date</th>
              <th className="p-2">Shift</th>
              <th className="p-2">Attendance</th>
              <th className="p-2">Overtime</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id} className="border-t border-app">
                <td className="p-2">{shift.staffName}</td>
                <td className="p-2">{shift.date}</td>
                <td className="p-2">{shift.shift}</td>
                <td className="p-2">
                  <select value={shift.attendance} onChange={(e) => dispatch(updateStaffShift({ ...shift, attendance: e.target.value as any }))} className="border border-app rounded-lg p-1 text-sm bg-transparent">
                    <option>Present</option>
                    <option>Absent</option>
                  </select>
                </td>
                <td className="p-2">
                  <input type="number" min="0" value={shift.overtimeHours} onChange={(e) => dispatch(updateStaffShift({ ...shift, overtimeHours: Number(e.target.value) || 0 }))} className="border border-app rounded-lg p-1 w-20 text-sm bg-transparent" />
                </td>
              </tr>
            ))}
            {shifts.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-subtle">No shifts created.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-surface border border-app rounded-xl p-3 space-y-2">
            <p className="font-semibold text-sm">{shift.staffName}</p>
            <p className="text-xs text-subtle">{shift.date} • {shift.shift}</p>
            <div className="grid grid-cols-2 gap-2">
              <select value={shift.attendance} onChange={(e) => dispatch(updateStaffShift({ ...shift, attendance: e.target.value as any }))} className="border border-app rounded-lg px-2 py-1.5 text-sm bg-transparent">
                <option>Present</option>
                <option>Absent</option>
              </select>
              <input type="number" min="0" value={shift.overtimeHours} onChange={(e) => dispatch(updateStaffShift({ ...shift, overtimeHours: Number(e.target.value) || 0 }))} placeholder="Overtime hrs" className="border border-app rounded-lg px-2 py-1.5 text-sm bg-transparent" />
            </div>
          </div>
        ))}
        {shifts.length === 0 && <p className="text-sm text-subtle text-center py-4">No shifts created.</p>}
      </div>
    </div>
  );
};

export default StaffRoster;
