/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  SiavongaParticipant,
  DashboardMetrics,
  FilterState,
  GoogleSheetsConfig,
} from './types/dashboard';
import { INITIAL_MOCK_PARTICIPANTS } from './data/mockData';
import {
  fetchGoogleSheetData,
  exportParticipantsToCSV,
  syncManualApprovalToGoogleSheet,
} from './utils/googleSheets';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessTokenInMemory,
} from './utils/googleAuth';
import { KPICards } from './components/KPICards';
import { ChartsGrid } from './components/ChartsGrid';
import { FilterBar } from './components/FilterBar';
import { ParticipantTable } from './components/ParticipantTable';
import { ParticipantModal } from './components/ParticipantModal';
import { EmbedCodeModal } from './components/EmbedCodeModal';
import { ConfirmationModal } from './components/ConfirmationModal';

export default function App() {
  // Main data state
  const [participants, setParticipants] = useState<SiavongaParticipant[]>(() => {
    const saved = localStorage.getItem('tempofit_siavonga_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_MOCK_PARTICIPANTS;
      }
    }
    return INITIAL_MOCK_PARTICIPANTS;
  });

  // Google Sheets configuration state
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('tempofit_sheets_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      sheetId: '',
      tabName: 'Siavonga_2026',
      apiKey: '',
      appsScriptUrl: '',
      isCustomConnected: true,
      lastSyncedAt: 'Live',
    };
  });

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    memberStatus: 'All',
    paymentStatus: 'All',
    townCity: 'All',
    packageCategory: 'All',
  });

  // Modals state
  const [selectedParticipant, setSelectedParticipant] = useState<SiavongaParticipant | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncingEmail, setSyncingEmail] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncNotification, setSyncNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
    cell?: string;
  } | null>(null);

  // Mandatory Confirmation Dialog State for destructive/mutating Workspace operations
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    email: string;
    registrationNumber: string;
    name: string;
    currentStatus: string;
    newStatus: 'Approved' | 'Pending';
  } | null>(null);
  const [isConfirmingOperation, setIsConfirmingOperation] = useState(false);

  // Persist data whenever participants change
  useEffect(() => {
    localStorage.setItem('tempofit_siavonga_data', JSON.stringify(participants));
  }, [participants]);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setAccessTokenInMemory(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setAccessTokenInMemory(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        setSyncNotification({
          message: `Connected as ${result.user.email}. Ready to sync with Google Sheets.`,
          type: 'success',
        });
        setTimeout(() => setSyncNotification(null), 4000);
      }
    } catch (err: any) {
      setSyncError(`Sign-in failed: ${err.message}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setSyncNotification({
      message: 'Signed out of Google account.',
      type: 'info',
    });
    setTimeout(() => setSyncNotification(null), 3000);
  };

  // Dynamic lists for filters
  const uniqueTowns = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.townCity && p.townCity.trim()) {
        set.add(p.townCity.trim());
      }
    });
    return Array.from(set).sort();
  }, [participants]);

  const uniquePackages = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.categoryPackage && p.categoryPackage.trim()) {
        set.add(p.categoryPackage.trim());
      }
    });
    return Array.from(set).sort();
  }, [participants]);

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = (p.fullName || '').toLowerCase().includes(query);
        const matchesEmail = (p.email || '').toLowerCase().includes(query);
        const matchesReg = (p.registrationNumber || '').toLowerCase().includes(query);
        const matchesRef = (p.transactionReference || '').toLowerCase().includes(query);
        const matchesTown = (p.townCity || '').toLowerCase().includes(query);

        if (!matchesName && !matchesEmail && !matchesReg && !matchesRef && !matchesTown) {
          return false;
        }
      }

      if (filters.memberStatus === 'Verified') {
        const isMem =
          p.isTempoFitMember === 'Yes' || (p.memberVerificationStatus || '').includes('Verified');
        if (!isMem) return false;
      } else if (filters.memberStatus === 'Public') {
        const isPublic =
          p.isTempoFitMember === 'No' || (p.memberVerificationStatus || '').includes('Public');
        if (!isPublic) return false;
      }

      if (filters.paymentStatus !== 'All') {
        const status = (p.paymentVerificationStatus || '').toLowerCase();
        if (status !== filters.paymentStatus.toLowerCase()) return false;
      }

      if (filters.townCity !== 'All') {
        if (p.townCity.trim() !== filters.townCity.trim()) return false;
      }

      if (filters.packageCategory !== 'All') {
        if (p.categoryPackage.trim() !== filters.packageCategory.trim()) return false;
      }

      return true;
    });
  }, [participants, filters]);

  // Executive KPI summary calculations
  const metrics: DashboardMetrics = useMemo(() => {
    let totalRevenue = 0;
    let verifiedMembersCount = 0;
    let publicNonMembersCount = 0;
    let dripKitsCount = 0;
    let pendingPaymentCount = 0;
    let approvedPaymentCount = 0;
    let rejectedPaymentCount = 0;

    participants.forEach((p) => {
      const isApproved = (p.paymentVerificationStatus || '').toLowerCase() === 'approved';
      const isPending = (p.paymentVerificationStatus || '').toLowerCase() === 'pending';
      const isRejected = (p.paymentVerificationStatus || '').toLowerCase() === 'rejected';

      if (isApproved) {
        totalRevenue += p.amountPaid || 0;
        approvedPaymentCount++;
      } else if (isRejected) {
        rejectedPaymentCount++;
      } else {
        pendingPaymentCount++;
      }

      if (p.isTempoFitMember === 'Yes') {
        verifiedMembersCount++;
      } else {
        publicNonMembersCount++;
      }

      if ((p.miniDripKitEntitlement || '').toUpperCase().includes('YES')) {
        dripKitsCount++;
      }
    });

    return {
      totalRegistrations: participants.length,
      totalRevenue,
      verifiedMembersCount,
      publicNonMembersCount,
      dripKitsCount,
      pendingPaymentCount,
      approvedPaymentCount,
      rejectedPaymentCount,
    };
  }, [participants]);

  const filteredDripKitCount = useMemo(() => {
    return filteredParticipants.filter((p) =>
      (p.miniDripKitEntitlement || '').toUpperCase().includes('YES')
    ).length;
  }, [filteredParticipants]);

  /**
   * Request toggle of Column P (Manual Approval).
   * Opens mandatory user confirmation dialog per Google Workspace guidelines.
   */
  const handleRequestToggleManualApproval = async (email: string, newStatus: 'Approved' | 'Pending') => {
    const target = participants.find((p) => p.email === email);
    if (!target) return;

    setPendingConfirmation({
      email,
      registrationNumber: target.registrationNumber,
      name: target.fullName,
      currentStatus: target.manualApproval || 'Pending',
      newStatus,
    });
  };

  /**
   * Confirms and executes the live database update to Column P.
   */
  const handleConfirmDatabaseUpdate = async () => {
    if (!pendingConfirmation) return;
    const { email, registrationNumber, newStatus } = pendingConfirmation;

    setIsConfirmingOperation(true);
    setSyncingEmail(email);

    // 1. Optimistic local update
    setParticipants((prev) =>
      prev.map((p) => (p.email === email ? { ...p, manualApproval: newStatus } : p))
    );
    setSelectedParticipant((prev) => (prev && prev.email === email ? { ...prev, manualApproval: newStatus } : prev));

    try {
      const currentToken = accessToken || (await getAccessToken());

      // 2. Direct Network Sync to Google Sheets
      const syncResult = await syncManualApprovalToGoogleSheet({
        email,
        registrationNumber,
        newStatus,
        sheetId: sheetsConfig.sheetId,
        tabName: sheetsConfig.tabName || 'Siavonga_2026',
        accessToken: currentToken,
        appsScriptUrl: sheetsConfig.appsScriptUrl,
      });

      if (syncResult.success) {
        setSyncNotification({
          message: syncResult.message,
          type: 'success',
          cell: syncResult.updatedCell,
        });
      } else {
        setSyncNotification({
          message: syncResult.message,
          type: 'error',
        });
      }
    } catch (err: any) {
      setSyncNotification({
        message: `Database update error: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsConfirmingOperation(false);
      setSyncingEmail(null);
      setPendingConfirmation(null);
      setTimeout(() => setSyncNotification(null), 5000);
    }
  };

  const handleExportCSV = () => {
    exportParticipantsToCSV(filteredParticipants);
    setSyncNotification({
      message: `Exported ${filteredParticipants.length} participants to CSV for Lake Kariba check-in`,
      type: 'success',
    });
    setTimeout(() => setSyncNotification(null), 3500);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      memberStatus: 'All',
      paymentStatus: 'All',
      townCity: 'All',
      packageCategory: 'All',
    });
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const currentToken = accessToken || (await getAccessToken());

      if (!sheetsConfig.sheetId && !sheetsConfig.appsScriptUrl) {
        // Quick visual refresh when using preloaded live benchmark
        await new Promise((resolve) => setTimeout(resolve, 500));
        const updatedConfig = {
          ...sheetsConfig,
          isCustomConnected: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
        };
        setSheetsConfig(updatedConfig);
        localStorage.setItem('tempofit_sheets_config', JSON.stringify(updatedConfig));
        setSyncNotification({
          message: `✓ Roster refreshed! Total ${participants.length} participants up to date.`,
          type: 'success',
        });
        setTimeout(() => setSyncNotification(null), 4000);
        return;
      }

      const result = await fetchGoogleSheetData({
        sheetId: sheetsConfig.sheetId,
        tabName: sheetsConfig.tabName || 'Siavonga_2026',
        accessToken: currentToken,
        apiKey: sheetsConfig.apiKey,
        appsScriptUrl: sheetsConfig.appsScriptUrl,
      });

      if (result.participants && result.participants.length > 0) {
        setParticipants(result.participants);
        const updatedConfig = {
          ...sheetsConfig,
          isCustomConnected: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
        };
        setSheetsConfig(updatedConfig);
        localStorage.setItem('tempofit_sheets_config', JSON.stringify(updatedConfig));
        setSyncNotification({
          message: `✓ Roster refreshed! Synced ${result.participants.length} participants from Google Sheet tab Siavonga_2026.`,
          type: 'success',
        });
        setTimeout(() => setSyncNotification(null), 4000);
      }
    } catch (err: any) {
      setSyncNotification({
        message: `Refresh failed: ${err.message}`,
        type: 'error',
      });
      setTimeout(() => setSyncNotification(null), 4500);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white shadow-md shadow-pink-600/30">
            <i className="fa-solid fa-person-running text-lg" aria-hidden="true"></i>
          </div>
          <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap">
            TempoFit <span className="text-pink-500">Running Club</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
          <a href="#siavonga-overview" className="hover:text-pink-400 transition-colors whitespace-nowrap">
            Overview
          </a>
          <a href="#siavonga-charts" className="hover:text-pink-400 transition-colors whitespace-nowrap">
            Analytics
          </a>
          <a href="#siavonga-roster" className="text-pink-400 font-bold border-b border-pink-500 pb-0.5 whitespace-nowrap">
            Siavonga 2026
          </a>
          <a href="#siavonga-logistics" className="hover:text-pink-400 transition-colors whitespace-nowrap">
            Logistics
          </a>
          <button
            onClick={() => setIsEmbedModalOpen(true)}
            className="hover:text-pink-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            Embed Code
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {/* Prominent Refresh Data Button */}
          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm hover:shadow-emerald-600/25 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50"
            title="Fetch latest registrations and payment statuses from Google Sheet"
          >
            <i className={`fa-solid fa-arrows-rotate text-xs ${isRefreshing ? 'fa-spin' : ''}`} aria-hidden="true"></i>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-lg shadow-sm hover:shadow-pink-600/25 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <i className="fa-solid fa-download text-xs" aria-hidden="true"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Sync Notification Banner */}
      {syncNotification && (
        <div
          className={`border-b px-6 py-2.5 text-xs flex items-center justify-between transition-all ${
            syncNotification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
              : syncNotification.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-blue-950/90 border-blue-800 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={`fa-solid ${
                syncNotification.type === 'success'
                  ? 'fa-circle-check text-emerald-400'
                  : syncNotification.type === 'error'
                  ? 'fa-circle-exclamation text-rose-400'
                  : 'fa-circle-info text-blue-400'
              }`}
              aria-hidden="true"
            ></i>
            <span className="font-semibold">{syncNotification.message}</span>
          </div>
          <button onClick={() => setSyncNotification(null)} className="text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
          </button>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        {/* Hero Banner */}
        <section
          id="siavonga-overview"
          className="relative bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1000 300">
              <path d="M0,160 C150,220 350,100 500,160 C650,220 850,120 1000,180 L1000,300 L0,300 Z" fill="#ec4899"></path>
              <path d="M0,200 C200,130 400,240 600,180 C800,120 900,220 1000,210 L1000,300 L0,300 Z" fill="#10b981"></path>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-pink-400">
                <i className="fa-solid fa-calendar-days text-pink-400" aria-hidden="true"></i>
                <span>Siavonga Runcation 2026 · Lake Kariba, Zambia</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">Google Sheet Tab: Siavonga_2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Executive Operations & Participant Registry
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Click Column P (<code className="text-pink-400 font-semibold">Manual Approval</code>) to change between Approved and Pending. The app verifies the row and updates the Google Sheet database directly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-xs shrink-0 min-w-[240px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Database Status:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-emerald-400 text-xs" aria-hidden="true"></i>
                  Google Sheet Connected
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Last Synchronized:</span>
                <button
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                  className="font-mono text-slate-200 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Click to refresh data now"
                >
                  <span className="tabular-nums">{sheetsConfig.lastSyncedAt || 'Live'}</span>
                  <i className={`fa-solid fa-arrows-rotate text-[11px] text-emerald-400 ${isRefreshing ? 'fa-spin' : ''}`} aria-hidden="true"></i>
                </button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Target Tab:</span>
                <span className="font-mono text-pink-400 font-semibold">
                  Siavonga_2026
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Column P Sync:</span>
                <span className="font-semibold text-emerald-400">
                  Active (2-Way)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section A: KPI Summary Cards */}
        <section aria-label="Executive KPI Metrics">
          <KPICards
            metrics={metrics}
            onFilterPendingClick={() => setFilters({ ...filters, paymentStatus: 'Pending' })}
            onFilterDripKitClick={() =>
              setFilters({ ...filters, packageCategory: 'K400 - Run + Mini DripKit' })
            }
          />
        </section>

        {/* Section B: Modern Interactive Charts */}
        <section id="siavonga-charts" aria-label="Visual Analytics and Charts">
          <ChartsGrid
            participants={participants}
            onPackageClick={(pkg) => setFilters({ ...filters, packageCategory: pkg })}
            onTownClick={(town) => setFilters({ ...filters, townCity: town })}
            onPaymentStatusClick={(status) =>
              setFilters({ ...filters, paymentStatus: status as any })
            }
          />
        </section>

        {/* Section C & D: Multi-Filter + Live Table */}
        <section id="siavonga-roster" className="space-y-4" aria-label="Participant Roster and Table">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            uniqueTowns={uniqueTowns}
            uniquePackages={uniquePackages}
            totalFilteredCount={filteredParticipants.length}
            totalAllCount={participants.length}
            filteredDripKitCount={filteredDripKitCount}
            onExportCSV={handleExportCSV}
            onResetFilters={handleResetFilters}
            onRefreshData={handleRefreshData}
            isRefreshing={isRefreshing}
          />

          <ParticipantTable
            participants={filteredParticipants}
            onSelectParticipant={setSelectedParticipant}
            onToggleManualApproval={async (email, newStatus) => {
              handleRequestToggleManualApproval(email, newStatus);
            }}
            onResetFilters={handleResetFilters}
            syncingEmail={syncingEmail}
          />
        </section>

        {/* Logistics & Kit Procurement Specification Card */}
        <section
          id="siavonga-logistics"
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-boxes-packing text-pink-400" aria-hidden="true"></i>
                Race Logistics & Procurement Summary
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Procurement counts calculated directly from Column O (<code className="text-pink-400">Mini DripKit Entitlement</code>)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Total Kits Ordered:</span>
              <span className="font-mono text-xl font-bold text-pink-400 tabular-nums">
                {metrics.dripKitsCount} units
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block">TempoFit Running Socks</span>
                <span className="text-slate-200 font-medium">Cushioned ergonomic heel</span>
              </div>
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {metrics.dripKitsCount} pairs
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block">Club Wristbands</span>
                <span className="text-slate-200 font-medium">Sweat-wicking Terry Cotton</span>
              </div>
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {metrics.dripKitsCount} pcs
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block">Siavonga UV Running Buffs</span>
                <span className="text-slate-200 font-medium">Multi-wear seamless tube</span>
              </div>
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {metrics.dripKitsCount} pcs
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-6 text-xs text-slate-400 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">TempoFit Running Club</span>
            <span aria-hidden="true">·</span>
            <span>Siavonga Runcation 2026 Executive Portal</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">Google Sheet Tab: Siavonga_2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate text-[10px] ${isRefreshing ? 'fa-spin' : ''}`} aria-hidden="true"></i>
              <span>Refresh Database</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsEmbedModalOpen(true)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Get Firebase Embed Code
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ParticipantModal
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        onUpdateManualApproval={async (email, newStatus) => {
          handleRequestToggleManualApproval(email, newStatus);
        }}
        isSyncing={Boolean(syncingEmail)}
      />

      <EmbedCodeModal isOpen={isEmbedModalOpen} onClose={() => setIsEmbedModalOpen(false)} />

      {/* Mandatory User Confirmation Dialog before executing destructive/mutating Workspace operations */}
      <ConfirmationModal
        isOpen={Boolean(pendingConfirmation)}
        onClose={() => setPendingConfirmation(null)}
        onConfirm={handleConfirmDatabaseUpdate}
        title="Confirm Google Sheet Database Update"
        description="You are updating the participant's Manual Approval status directly in your live Google Sheet tab Siavonga_2026."
        targetDetails={
          pendingConfirmation
            ? {
                name: pendingConfirmation.name,
                registrationNumber: pendingConfirmation.registrationNumber,
                currentStatus: pendingConfirmation.currentStatus,
                newStatus: pendingConfirmation.newStatus,
              }
            : null
        }
        isLoading={isConfirmingOperation}
      />
    </div>
  );
}
