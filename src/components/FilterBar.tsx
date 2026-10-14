import React from 'react';
import { FilterState } from '../types/dashboard';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  uniqueTowns: string[];
  uniquePackages: string[];
  totalFilteredCount: number;
  totalAllCount: number;
  filteredDripKitCount: number;
  onExportCSV: () => void;
  onResetFilters: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  uniqueTowns,
  uniquePackages,
  totalFilteredCount,
  totalAllCount,
  filteredDripKitCount,
  onExportCSV,
  onResetFilters,
  onRefreshData,
  isRefreshing = false,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.memberStatus !== 'All' ||
    filters.paymentStatus !== 'All' ||
    filters.townCity !== 'All' ||
    filters.packageCategory !== 'All';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      {/* Top row: Search input + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden="true"></i>
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search by Name, Email, Reg # (e.g. TF-SIAV-0001), or Trans Ref..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              title="Clear search"
            >
              <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
            </button>
          )}
        </div>

        {/* Action Controls & Logistics Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Summary Badge for Logistics Procurement */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border border-pink-500/30 rounded-lg text-xs"
            title="Total Mini DripKits in current view for procurement (Socks, Wristband, Buff)"
          >
            <i className="fa-solid fa-box text-pink-400" aria-hidden="true"></i>
            <span className="text-slate-300">Procure DripKits:</span>
            <span className="font-mono font-bold text-pink-400 tabular-nums">
              {filteredDripKitCount}
            </span>
          </div>

          {/* Prominent Refresh Data Button */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-emerald-500/20 transition-all whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh database from Google Sheet tab Siavonga_2026"
            >
              <i className={`fa-solid fa-arrows-rotate text-xs ${isRefreshing ? 'fa-spin' : ''}`} aria-hidden="true"></i>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          )}

          {/* Export to CSV Button */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-pink-500/20 transition-all whitespace-nowrap cursor-pointer active:scale-95"
            title="Download CSV for race-day check-in at Lake Kariba"
          >
            <i className="fa-solid fa-file-arrow-down text-sm" aria-hidden="true"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80 items-center">
        {/* Filter 1: Member Status */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Member Status
          </label>
          <select
            value={filters.memberStatus}
            onChange={(e) => onFilterChange({ ...filters, memberStatus: e.target.value as any })}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="All">All Members & Public</option>
            <option value="Verified">TempoFit Members (Yes)</option>
            <option value="Public">Public Non-Members (No)</option>
          </select>
        </div>

        {/* Filter 2: Payment Status */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Payment Status
          </label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => onFilterChange({ ...filters, paymentStatus: e.target.value as any })}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="All">All Payment States</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Filter 3: Town / City (Dynamic) */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Town / City
          </label>
          <select
            value={filters.townCity}
            onChange={(e) => onFilterChange({ ...filters, townCity: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="All">All Locations</option>
            {uniqueTowns.map((town) => (
              <option key={town} value={town}>
                {town}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 4: Package / Category */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Category / Package
          </label>
          <select
            value={filters.packageCategory}
            onChange={(e) => onFilterChange({ ...filters, packageCategory: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="All">All Packages</option>
            <option value="Free - Member Participation">Free - Member Participation</option>
            <option value="K150 - Run Only">K150 - Run Only</option>
            <option value="K400 - Run + Mini DripKit">K400 - Run + Mini DripKit</option>
            {uniquePackages
              .filter(
                (pkg) =>
                  pkg !== 'Free - Member Participation' &&
                  pkg !== 'K150 - Run Only' &&
                  pkg !== 'K400 - Run + Mini DripKit'
              )
              .map((pkg) => (
                <option key={pkg} value={pkg}>
                  {pkg}
                </option>
              ))}
          </select>
        </div>

        {/* Filter Results & Reset button */}
        <div className="flex items-center justify-between col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1 pt-1 lg:pt-4">
          <div className="text-xs text-slate-400">
            Showing <span className="font-mono font-semibold text-white tabular-nums">{totalFilteredCount}</span> of{' '}
            <span className="font-mono text-slate-400 tabular-nums">{totalAllCount}</span>
          </div>
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-medium underline-offset-2 hover:underline ml-auto"
            >
              <i className="fa-solid fa-rotate-left text-[11px]" aria-hidden="true"></i>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
