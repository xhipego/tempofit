import React from 'react';
import { DashboardMetrics } from '../types/dashboard';

interface KPICardsProps {
  metrics: DashboardMetrics;
  onFilterPendingClick?: () => void;
  onFilterDripKitClick?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  metrics,
  onFilterPendingClick,
  onFilterDripKitClick,
}) => {
  const memberRatioPercent = metrics.totalRegistrations > 0
    ? Math.round((metrics.verifiedMembersCount / metrics.totalRegistrations) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Registrations */}
      <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Registrations
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <i className="fa-solid fa-users text-sm" aria-hidden="true"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.totalRegistrations}
          </span>
          <span className="text-xs text-slate-400">runners</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span className="text-emerald-400 font-medium">Siavonga 2026</span>
          <span aria-hidden="true">·</span>
          <span>Lake Kariba Runcation</span>
        </div>
      </div>

      {/* 2. Total Revenue Collected (K) */}
      <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Revenue Collected
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <i className="fa-solid fa-money-bill-wave text-sm" aria-hidden="true"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-bold text-emerald-400">ZMW</span>
          <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
            K{metrics.totalRevenue.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span className="text-emerald-400 font-medium">{metrics.approvedPaymentCount}</span>
          <span>settled payments</span>
        </div>
      </div>

      {/* 3. Verified Members vs. Public Ratio */}
      <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Members vs Public
          </span>
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
            <i className="fa-solid fa-id-badge text-sm" aria-hidden="true"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
            {metrics.verifiedMembersCount} <span className="text-lg text-slate-500 font-normal">/</span> {metrics.publicNonMembersCount}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>{memberRatioPercent}% TempoFit club</span>
          <span className="text-slate-400 font-mono tabular-nums">{100 - memberRatioPercent}% Public</span>
        </div>
      </div>

      {/* 4. Mini DripKits to Procure */}
      <div 
        onClick={onFilterDripKitClick}
        className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-pink-500/40 transition-all cursor-pointer group"
        title="Click to view DripKit participants"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Mini DripKits to Procure
          </span>
          <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-box-open text-sm" aria-hidden="true"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-pink-400 font-mono tabular-nums">
            {metrics.dripKitsCount}
          </span>
          <span className="text-xs text-slate-400">kits</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span className="text-pink-400 font-medium">Logistics spec:</span>
          <span className="truncate">Socks, Wristband, Buff</span>
        </div>
      </div>

      {/* 5. Pending Payment Approvals */}
      <div 
        onClick={onFilterPendingClick}
        className={`relative bg-slate-900/90 border rounded-xl p-5 shadow-sm transition-all cursor-pointer group ${
          metrics.pendingPaymentCount > 0 
            ? 'border-amber-500/40 hover:border-amber-400/80' 
            : 'border-slate-800 hover:border-slate-700'
        }`}
        title="Click to filter pending payments"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Pending Approvals
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            metrics.pendingPaymentCount > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}>
            <i className="fa-solid fa-clock-rotate-left text-sm" aria-hidden="true"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold font-mono tabular-nums ${
            metrics.pendingPaymentCount > 0 ? 'text-amber-400' : 'text-slate-300'
          }`}>
            {metrics.pendingPaymentCount}
          </span>
          <span className="text-xs text-slate-400">requiring review</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span className={metrics.pendingPaymentCount > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
            {metrics.pendingPaymentCount > 0 ? 'Action required' : 'All clear'}
          </span>
          {metrics.rejectedPaymentCount > 0 && (
            <span className="text-rose-400 font-mono tabular-nums">{metrics.rejectedPaymentCount} rejected</span>
          )}
        </div>
      </div>
    </div>
  );
};
