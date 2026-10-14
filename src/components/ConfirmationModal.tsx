import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  targetDetails: {
    name: string;
    registrationNumber: string;
    currentStatus: string;
    newStatus: string;
    targetCell?: string;
  } | null;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  targetDetails,
  isLoading = false,
}) => {
  if (!isOpen || !targetDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <i className="fa-solid fa-pen-to-square text-base" aria-hidden="true"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Google Sheet Tab: <span className="text-emerald-400 font-mono">Siavonga_2026</span></p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {description}
        </p>

        {/* Change Preview Box */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Participant:</span>
            <span className="font-semibold text-white">{targetDetails.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Registration Bib:</span>
            <span className="font-mono text-pink-400">{targetDetails.registrationNumber}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Target Column:</span>
            <span className="font-mono text-slate-200 font-medium">Column P (Manual Approval)</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">State Transition:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                targetDetails.currentStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {targetDetails.currentStatus}
              </span>
              <i className="fa-solid fa-arrow-right text-[10px] text-slate-500" aria-hidden="true"></i>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                targetDetails.newStatus === 'Approved' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-amber-500 text-slate-950 shadow-sm'
              }`}>
                {targetDetails.newStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true"></i>
                <span>Writing to Google Sheet...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up text-xs" aria-hidden="true"></i>
                <span>Confirm & Update Column P</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
