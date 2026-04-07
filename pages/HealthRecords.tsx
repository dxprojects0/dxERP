import React, { useMemo, useState } from 'react';
import { Plus, Printer, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addHealthRecord, updateHealthRecord } from '../features/businessSlice';
import { HealthRecord } from '../types';
import Modal from '../components/Modal';
import { printHtmlDocument } from '../utils/print';

const blankForm = {
  patientName: '',
  patientPhone: '',
  diagnosisNotes: '',
  prescriptionUrl: '',
  followUpDate: '',
};

const HealthRecords: React.FC = () => {
  const dispatch = useDispatch();
  const records = useSelector((state: RootState) => state.business.healthRecords);
  const [query, setQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeRecord, setActiveRecord] = useState<HealthRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);

  const filtered = useMemo(() => {
    const token = query.trim().toLowerCase();
    const sorted = [...records].sort((a, b) => b.visitDate.localeCompare(a.visitDate));
    if (!token) return sorted;
    return sorted.filter((record) =>
      [record.patientName, record.patientPhone, record.diagnosisNotes].some((field) =>
        String(field || '').toLowerCase().includes(token),
      ),
    );
  }, [records, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm);
    setShowFormModal(true);
  };

  const openEdit = (record: HealthRecord) => {
    setEditingId(record.id);
    setForm({
      patientName: record.patientName,
      patientPhone: record.patientPhone,
      diagnosisNotes: record.diagnosisNotes,
      prescriptionUrl: record.prescriptionUrl || '',
      followUpDate: record.followUpDate || '',
    });
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const saveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: HealthRecord = {
      id: editingId || `EHR-${Date.now().toString().slice(-6)}`,
      visitDate: editingId ? (records.find((record) => record.id === editingId)?.visitDate || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
      patientName: form.patientName.trim(),
      patientPhone: form.patientPhone.trim(),
      diagnosisNotes: form.diagnosisNotes.trim(),
      prescriptionUrl: form.prescriptionUrl.trim() || undefined,
      followUpDate: form.followUpDate || undefined,
    };

    if (editingId) {
      dispatch(updateHealthRecord(payload));
    } else {
      dispatch(addHealthRecord(payload));
    }
    setShowFormModal(false);
    setEditingId(null);
    setForm(blankForm);
  };

  const printRecord = (record: HealthRecord) => {
    printHtmlDocument(
      `Health Record ${record.id}`,
      `
          <h1 style="margin-bottom:0;">Health Record</h1>
          <p style="color:#64748b;">ID: ${record.id}</p>
          <hr />
          <p><strong>Patient:</strong> ${record.patientName}</p>
          <p><strong>Phone:</strong> ${record.patientPhone}</p>
          <p><strong>Visit Date:</strong> ${record.visitDate}</p>
          <p><strong>Follow-up:</strong> ${record.followUpDate || '-'}</p>
          <p><strong>Prescription:</strong> ${record.prescriptionUrl || '-'}</p>
          <p><strong>Diagnosis Notes:</strong></p>
          <p>${record.diagnosisNotes}</p>
      `,
      800,
      900,
    );
  };

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h1 className="text-3xl font-black">Health Records</h1>
        <p className="text-sm text-subtle">Search patient history, open details, print records, and update same patient entries.</p>
      </div>

      <section className="bg-surface border border-app rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="h-10 w-10 rounded-xl bg-primary-app text-white flex items-center justify-center"
            title="Add new health record"
          >
            <Plus size={16} />
          </button>
          <div className="flex-1 border border-app rounded-xl px-3 py-2 flex items-center gap-2">
            <Search size={15} className="text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by patient name or phone number"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[62vh] overflow-y-auto">
          {filtered.map((record) => (
            <button
              key={record.id}
              onClick={() => {
                setActiveRecord(record);
                setShowDetailModal(true);
              }}
              className="w-full text-left border border-app rounded-xl p-3"
            >
              <p className="font-semibold text-sm">{record.patientName}</p>
              <p className="text-xs text-subtle">{record.patientPhone} • Visit: {record.visitDate}</p>
              <p className="text-xs text-subtle mt-1 truncate">{record.diagnosisNotes}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-subtle py-2">No matching records found.</p>}
        </div>
      </section>

      {showFormModal && (
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={editingId ? 'Update Health Record' : 'Add Health Record'}
          maxWidth="34rem"
          closeOnBackdrop={false}
        >
          <form onSubmit={saveRecord} className="space-y-3">
            <input required className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" placeholder="Patient name" value={form.patientName} onChange={(e) => setForm((prev) => ({ ...prev, patientName: e.target.value }))} />
            <input required className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" placeholder="Phone number" value={form.patientPhone} onChange={(e) => setForm((prev) => ({ ...prev, patientPhone: e.target.value }))} />
            <textarea required className="w-full border border-app rounded-xl px-3 py-2 bg-transparent min-h-[110px]" placeholder="Diagnosis notes and additional details" value={form.diagnosisNotes} onChange={(e) => setForm((prev) => ({ ...prev, diagnosisNotes: e.target.value }))} />
            <input className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" placeholder="Prescription URL (optional)" value={form.prescriptionUrl} onChange={(e) => setForm((prev) => ({ ...prev, prescriptionUrl: e.target.value }))} />
            <input type="date" className="w-full border border-app rounded-xl px-3 py-2 bg-transparent" value={form.followUpDate} onChange={(e) => setForm((prev) => ({ ...prev, followUpDate: e.target.value }))} />
            <button className="w-full bg-primary-app text-white rounded-xl py-2.5 font-semibold">
              {editingId ? 'Update Record' : 'Save Record'}
            </button>
          </form>
        </Modal>
      )}

      {showDetailModal && activeRecord && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Patient Details"
          maxWidth="34rem"
          closeOnBackdrop
        >
          <div className="space-y-3">
            <div className="border border-app rounded-xl p-3 space-y-1 text-sm">
              <p><span className="font-semibold">Name:</span> {activeRecord.patientName}</p>
              <p><span className="font-semibold">Phone:</span> {activeRecord.patientPhone}</p>
              <p><span className="font-semibold">Visit Date:</span> {activeRecord.visitDate}</p>
              <p><span className="font-semibold">Follow-up:</span> {activeRecord.followUpDate || '-'}</p>
              <p><span className="font-semibold">Prescription:</span> {activeRecord.prescriptionUrl || '-'}</p>
              <p><span className="font-semibold">Diagnosis:</span> {activeRecord.diagnosisNotes}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => printRecord(activeRecord)} className="px-3 py-2 rounded-xl border border-app text-sm font-semibold inline-flex items-center justify-center gap-2">
                <Printer size={14} /> Print
              </button>
              <button onClick={() => openEdit(activeRecord)} className="px-3 py-2 rounded-xl bg-primary-app text-white text-sm font-semibold">
                Update
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HealthRecords;
