import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, confirmText, onConfirm, onCancel }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-sm flex flex-col m-4 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="confirmation-title" className="text-lg font-bold text-gray-200">{title}</h2>
          <button 
            onClick={onCancel} 
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close confirmation"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="p-6">
          <p className="text-gray-300 text-sm">{message}</p>
        </main>
        <footer className="flex justify-end items-center gap-3 p-4 bg-gray-900/50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;