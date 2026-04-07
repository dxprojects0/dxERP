import React from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<Props> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="24rem"
      closeOnBackdrop
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-red-500">
          <div className="p-2 bg-red-50 rounded-full">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-500 leading-relaxed">{message}</p>
        <div className="flex border-t border-slate-100 pt-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 px-6 py-4 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
