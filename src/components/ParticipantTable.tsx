import React, { useState } from 'react';
import { SiavongaParticipant } from '../types/dashboard';

interface ParticipantTableProps {
  participants: SiavongaParticipant[];
  onSelectParticipant: (participant: SiavongaParticipant) => void;
  onToggleManualApproval: (email: string, newStatus: 'Approved' | 'Pending') => Promise<void>;
  onResetFilters?: () => void;
  syncingEmail?: string | null;
}

type SortField =
  | 'registrationNumber'
  | 'fullName'
  | 'townCity'
  | 'categoryPackage'
  | 'amountPaid'
  | 'paymentVerificationStatus'
  | 'manualApproval'
  | 'timestamp';
type SortDirection = 'asc' | 'desc';

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  participants,
  onSelectParticipant,
  onToggleManualApproval,
  onResetFilters,
  syncingEmail,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortField, setSortField] = useState<SortField>('registrationNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sorting
  const sortedParticipants = [...participants].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';

    if (sortField === 'amountPaid') {
      return sortDirection === 'asc' ? a.amountPaid - b.amountPaid : b.amountPaid - a.amountPaid;
    }

    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(sortedParticipants.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedParticipants = sortedParticipants.slice(startIndex, startIndex + rowsPerPage);

  const getPaymentBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <i className="fa-solid fa-circle-check text-[10px]" aria-hidden="true"></i>
          Approved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <i className="fa-solid fa-circle-xmark text-[10px]" aria-hidden="true"></i>
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <i className="fa-solid fa-clock text-[10px]" aria-hidden="true"></i>
        Pending
      </span>
    );
  };

  const getMemberBadge = (status: string, isMember: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('verified') || isMember === 'Yes') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <i className="fa-solid fa-badge-check text-emerald-400" aria-hidden="true"></i>
          Verified Member
        </span>
      );
    }
    if (s.includes('not found') || s.includes('warning') || s.includes('⚠️')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium" title="Email not found in membership registry">
          <i className="fa-solid fa-triangle-exclamation text-amber-400" aria-hidden="true"></i>
          Email Not Found
        </span>
      );
    }
    return <span className="text-xs text-slate-400">Public</span>;
  };

  const getDripKitBadge = (dripKit: string) => {
    const isYes = (dripKit || '').toUpperCase().includes('YES');
    if (isYes) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40">
          <i className="fa-solid fa-box text-[10px]" aria-hidden="true"></i>
          YES (Full Kit)
        </span>
      );
    }
    return <span className="text-xs text-slate-400 font-mono">NO</span>;
  };

  const getStageBadge = (stage: string) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('stage 2') || s.includes('confirmed')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <i className="fa-solid fa-check text-[10px]" aria-hidden="true"></i>
          Stage 2 Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <i className="fa-solid fa-paper-plane text-[10px]" aria-hidden="true"></i>
        Stage 1 Sent
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-table-list text-pink-500" aria-hidden="true"></i>
            Registered Participants Roster
          </h3>
          <span className="text-xs text-slate-400">
            ({sortedParticipants.length} total matched)
          </span>
          <span className="hidden sm:inline-block text-[11px] text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded ml-2">
            Click Column P to toggle Manual Approval
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider select-none font-medium">
              <th
                onClick={() => handleSort('registrationNumber')}
                className="py-3 px-3 cursor-pointer hover:text-pink-400 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Reg #</span>
                  {sortField === 'registrationNumber' && (
                    <i
                      className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'} text-[10px] text-pink-400`}
                      aria-hidden="true"
                    ></i>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('fullName')}
                className="py-3 px-3 cursor-pointer hover:text-pink-400 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Full Name</span>
                  {sortField === 'fullName' && (
                    <i
                      className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'} text-[10px] text-pink-400`}
                      aria-hidden="true"
                    ></i>
                  )}
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap">Email Address</th>
              <th
                onClick={() => handleSort('townCity')}
                className="py-3 px-3 cursor-pointer hover:text-pink-400 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Town / City</span>
                  {sortField === 'townCity' && (
                    <i
                      className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'} text-[10px] text-pink-400`}
                      aria-hidden="true"
                    ></i>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('categoryPackage')}
                className="py-3 px-3 cursor-pointer hover:text-pink-400 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Category / Package</span>
                  {sortField === 'categoryPackage' && (
                    <i
                      className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'} text-[10px] text-pink-400`}
                      aria-hidden="true"
                    ></i>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('amountPaid')}
                className="py-3 px-3 cursor-pointer hover:text-pink-400 transition-colors whitespace-nowrap text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount (K)</span>
                  {sortField === 'amountPaid' && (
                    <i
                      className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'} text-[10px] text-pink-400`}
                      aria-hidden="true"
                    ></i>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('paymentVerificationStatus')}
                className="py-3 px-3 cursor-pointer hover:text-pink-400 transition-colors whitespace-nowrap text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Payment Status</span>
                  {sortField === 'paymentVerificationStatus' && (
                    <i
                      className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'} text-[10px] text-pink-400`}
                      aria-hidden="true"
                    ></i>
                  )}
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-center">DripKit</th>
              <th className="py-3 px-3 whitespace-nowrap">Member Verification</th>
              <th className="py-3 px-3 whitespace-nowrap">Stage Status</th>

              {/* CRITICAL: Column P (Manual Approval) with prominent highlight */}
              <th
                onClick={() => handleSort('manualApproval')}
                className="py-3 px-3.5 bg-pink-950/40 border-l border-r border-pink-500/30 text-pink-300 font-bold whitespace-nowrap text-center cursor-pointer hover:bg-pink-900/40 transition-colors"
                title="Click column to sort; Click cells to toggle Approved/Pending in Google Sheets"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <i className="fa-solid fa-pen-to-square text-xs text-pink-400" aria-hidden="true"></i>
                  <span>Manual Approval (Col P)</span>
                  {sortField === 'manualApproval' && (
                    <i
                      className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'} text-[10px] text-pink-300`}
                      aria-hidden="true"
                    ></i>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {displayedParticipants.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <i className="fa-solid fa-inbox text-3xl text-slate-600 mb-1" aria-hidden="true"></i>
                    <p className="text-sm font-medium text-slate-300">No participants match the current filters</p>
                    <p className="text-xs text-slate-500">Try adjusting your search criteria or resetting filters</p>
                    {onResetFilters && (
                      <button
                        onClick={onResetFilters}
                        className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-pink-400 rounded-lg border border-slate-700"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayedParticipants.map((p) => {
                const isApproved = p.manualApproval === 'Approved';
                const isCurrentlySyncing = syncingEmail === p.email;

                return (
                  <tr
                    key={p.registrationNumber || p.email}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectParticipant(p)}
                    title="Click row to view full participant dossier"
                  >
                    {/* Reg # */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-pink-400 whitespace-nowrap tabular-nums">
                      {p.registrationNumber}
                    </td>

                    {/* Full Name */}
                    <td className="py-2.5 px-3 font-medium text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{p.fullName}</span>
                        {p.medicalConditions && p.medicalConditions !== 'None' && (
                          <span title={`Medical: ${p.medicalConditions}`} className="text-rose-400">
                            <i className="fa-solid fa-briefcase-medical text-[10px]" aria-hidden="true"></i>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap max-w-[190px] truncate" title={p.email}>
                      {p.email}
                    </td>

                    {/* Town / City */}
                    <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">{p.townCity}</td>

                    {/* Category / Package */}
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      <span className="truncate block max-w-[180px]" title={p.categoryPackage}>
                        {p.categoryPackage}
                      </span>
                    </td>

                    {/* Amount Paid */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100 tabular-nums whitespace-nowrap">
                      K{p.amountPaid.toLocaleString()}
                    </td>

                    {/* Payment Status (View Only) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getPaymentBadge(p.paymentVerificationStatus)}
                    </td>

                    {/* DripKit (View Only) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getDripKitBadge(p.miniDripKitEntitlement)}
                    </td>

                    {/* Member Verification (View Only) */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getMemberBadge(p.memberVerificationStatus, p.isTempoFitMember)}
                    </td>

                    {/* Stage Status (View Only) */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStageBadge(p.confirmationStatus)}
                    </td>

                    {/* THE ONLY EDITABLE FIELD: Column P (Manual Approval) */}
                    <td
                      className="py-2.5 px-3.5 bg-slate-950/40 border-l border-r border-pink-500/20 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()} // Stop row click so toggle is instant
                    >
                      <button
                        type="button"
                        disabled={isCurrentlySyncing}
                        onClick={() => onToggleManualApproval(p.email, isApproved ? 'Pending' : 'Approved')}
                        className={`group/btn relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 cursor-pointer ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-xs'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-xs'
                        }`}
                        title="Click to toggle Column P between Approved and Pending (Syncs to Google Sheets)"
                      >
                        {isCurrentlySyncing ? (
                          <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden="true"></i>
                        ) : isApproved ? (
                          <i className="fa-solid fa-circle-check text-emerald-400 text-xs" aria-hidden="true"></i>
                        ) : (
                          <i className="fa-solid fa-clock text-amber-400 text-xs" aria-hidden="true"></i>
                        )}
                        <span>{p.manualApproval || 'Pending'}</span>
                        <i className="fa-solid fa-repeat text-[9px] opacity-40 group-hover/btn:opacity-100 ml-0.5 text-pink-400 transition-opacity" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-mono text-slate-200 tabular-nums">
            {displayedParticipants.length > 0 ? startIndex + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-mono text-slate-200 tabular-nums">
            {Math.min(startIndex + rowsPerPage, sortedParticipants.length)}
          </span>{' '}
          of <span className="font-mono text-slate-200 tabular-nums">{sortedParticipants.length}</span> entries
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <i className="fa-solid fa-chevron-left text-[10px] mr-1" aria-hidden="true"></i>
            Prev
          </button>

          <span className="px-2 font-mono text-slate-300 tabular-nums">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            Next
            <i className="fa-solid fa-chevron-right text-[10px] ml-1" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
