import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import { emitToast } from '../utils/toast';

interface PaidInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestedPlan: 'pro' | 'business';
  currentPhone?: string;
  onSubmitPhone: (phone: string) => Promise<void>;
}

const PaidInterestModal: React.FC<PaidInterestModalProps> = ({
  isOpen,
  onClose,
  requestedPlan,
  currentPhone,
  onSubmitPhone,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState(currentPhone || '');

  React.useEffect(() => {
    if (isOpen) {
      setPhone(currentPhone || '');
    }
  }, [isOpen, currentPhone]);

  const planLabel = useMemo(() => (requestedPlan === 'pro' ? 'Pro' : 'Business+'), [requestedPlan]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      emitToast({ variant: 'error', message: 'Phone number is required.' });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitPhone(phone.trim());
      emitToast({ variant: 'info', message: 'Request sent' });
      onClose();
    } catch (error: any) {
      emitToast({ variant: 'error', message: error?.message || 'Failed to save plan details.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Complete ${planLabel} Setup`}
      maxWidth="30rem"
      closeOnBackdrop={false}
    >
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-subtle">
          Phone number is required to submit your paid plan request.
        </p>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="w-full border border-app rounded-xl px-3 py-2 bg-transparent"
        />
        <div className="sticky bottom-0 bg-surface pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2.5 rounded-xl bg-primary-app text-white font-semibold disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : `Submit ${planLabel} Request`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaidInterestModal;
