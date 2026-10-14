import React, { useState, useEffect } from 'react';
import { SiavongaParticipant } from '../types/dashboard';

interface ParticipantModalProps {
  participant: SiavongaParticipant | null;
  onClose: () => void;
  onUpdateManualApproval: (email: string, newStatus: 'Approved' | 'Pending') => Promise<void>;
  isSyncing?: boolean;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  participant,
  onClose,
  onUpdateManualApproval,
  isSyncing = false,
}) => {
  if (!participant) return null;

  // The ONLY editable property as requested by the user
  const [manualApproval, setManualApproval] = useState<'Approved' | 'Pending'>(
    (participant.manualApproval === 'Approved' ? 'Approved' : 'Pending')
  );
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  useEffect(() => {
    if (participant) {
      setManualApproval(participant.manualApproval === 'Approved' ? 'Approved' : 'Pending');
      setSyncStatusText(null);
    }
  }, [participant]);

  const handleToggle = async (status: 'Approved' | 'Pending') => {
    setManualApproval(status);
    setSyncStatusText(`Syncing Column P to "${status}"...`);
    await onUpdateManualApproval(participant.email, status);
    setSyncStatusText(`✓ Column P synchronized to "${status}" in Google Sheets database`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xs z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-pink-500/15 text-pink-400 border border-pink-500/30 rounded-md">
                {participant.registrationNumber}
              </span>
              <h2 className="text-lg font-bold text-white">{participant.fullName}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                View-Only Dossier
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Siavonga Runcation 2026 · Lake Kariba Participant Profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* CRITICAL: The ONLY editable control - Column P Manual Approval */}
          <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-pink-500/40 rounded-xl space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                  <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                    Column P · Manual Approval (Live Google Sheets Sync)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  This is the only editable field. Changes automatically synchronize to Column P in your Google Sheets database.
                </p>
              </div>

              {/* Segmented Switch for Column P */}
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => handleToggle('Approved')}
                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    manualApproval === 'Approved'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-check text-xs" aria-hidden="true"></i>
                  Approved
                </button>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => handleToggle('Pending')}
                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    manualApproval === 'Pending'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-clock text-xs" aria-hidden="true"></i>
                  Pending
                </button>
              </div>
            </div>

            {syncStatusText && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-2 font-medium">
                {isSyncing ? (
                  <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true"></i>
                ) : (
                  <i className="fa-solid fa-cloud-arrow-up text-xs" aria-hidden="true"></i>
                )}
                <span>{syncStatusText}</span>
              </div>
            )}
          </div>

          {/* VIEW-ONLY: Participant Information Cards (Read-only as requested) */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-blue-400" aria-hidden="true"></i>
              Participant Information (View-Only)
            </h4>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 block">Package (Col G)</span>
                <span className="text-xs font-semibold text-white mt-0.5 block truncate" title={participant.categoryPackage}>
                  {participant.categoryPackage}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 block">Amount Paid (Col I)</span>
                <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block tabular-nums">
                  K{participant.amountPaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 block">Member (Col F)</span>
                <span className={`text-xs font-semibold mt-0.5 block ${participant.isTempoFitMember === 'Yes' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {participant.isTempoFitMember === 'Yes' ? 'Yes (TempoFit)' : 'No (Public)'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 block">Location (Col E)</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">
                  {participant.townCity}
                </span>
              </div>
            </div>

            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Email Address (Primary Key, Col B)</span>
                <span className="text-slate-200 font-mono select-all block">{participant.email}</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Phone Number (Col D)</span>
                <span className="text-slate-200 font-mono block">{participant.phoneNumber}</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Transaction Reference (Col H)</span>
                <span className="text-slate-200 font-mono select-all block">{participant.transactionReference || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Registration Timestamp (Col A)</span>
                <span className="text-slate-300 font-mono block tabular-nums">{participant.timestamp}</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Payment Verification (Col N)</span>
                <span className={`font-semibold block ${
                  participant.paymentVerificationStatus === 'Approved' ? 'text-emerald-400' :
                  participant.paymentVerificationStatus === 'Rejected' ? 'text-rose-400' : 'text-amber-300'
                }`}>
                  {participant.paymentVerificationStatus}
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Mini DripKit Entitlement (Col O)</span>
                <span className="text-pink-300 font-semibold block">{participant.miniDripKitEntitlement}</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Member Verification Status (Col L)</span>
                <span className="text-slate-200 font-medium block">{participant.memberVerificationStatus}</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 block">Confirmation Stage (Col Q)</span>
                <span className="text-emerald-400 font-medium block">{participant.confirmationStatus}</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1 sm:col-span-2">
                <span className="text-[11px] text-slate-500 block">Emergency Contact (Col J)</span>
                <span className="text-slate-200 block font-medium">{participant.emergencyContact}</span>
              </div>

              <div className={`p-3 border rounded-lg sm:col-span-2 ${
                participant.medicalConditions && participant.medicalConditions !== 'None'
                  ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300'
              }`}>
                <span className="text-[11px] text-slate-500 block mb-0.5">Medical Conditions / Injuries (Col K)</span>
                <span className="block font-medium">{participant.medicalConditions || 'None reported'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900 sticky bottom-0">
          <div className="text-xs text-slate-400">
            Reg: <span className="font-mono text-slate-200">{participant.registrationNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
