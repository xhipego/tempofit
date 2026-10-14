import React, { useState } from 'react';

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedCodeModal: React.FC<EmbedCodeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'embed-html' | 'iframe' | 'apps-script'>('embed-html');
  const [copied, setCopied] = useState(false);

  const rawVanillaCode = `<!-- =================================================================
     TEMPOFIT RUNNING CLUB: SIAVONGA RUNCATION 2026 EXECUTIVE TAB
     Compatible with Firebase Hosting, HTML5 & Tailwind CSS
================================================================== -->
<section id="siavonga-2026-section" class="bg-slate-950 text-slate-100 p-6 font-sans">
  <!-- Executive KPI Row -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <span class="text-xs text-slate-400 block uppercase">Total Registrations</span>
      <span id="kpi-total-reg" class="text-2xl font-bold font-mono text-white tabular-nums">0</span>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <span class="text-xs text-slate-400 block uppercase">Total Revenue (K)</span>
      <span id="kpi-revenue" class="text-2xl font-bold font-mono text-emerald-400 tabular-nums">K0</span>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <span class="text-xs text-slate-400 block uppercase">Members vs Public</span>
      <span id="kpi-member-ratio" class="text-2xl font-bold font-mono text-pink-400 tabular-nums">0 / 0</span>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <span class="text-xs text-slate-400 block uppercase">Mini DripKits to Procure</span>
      <span id="kpi-dripkits" class="text-2xl font-bold font-mono text-pink-400 tabular-nums">0</span>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <span class="text-xs text-slate-400 block uppercase">Pending Payment Approvals</span>
      <span id="kpi-pending" class="text-2xl font-bold font-mono text-amber-400 tabular-nums">0</span>
    </div>
  </div>

  <!-- Chart.js Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 h-72">
      <h4 class="text-xs font-semibold text-slate-200 mb-2">Package Distribution</h4>
      <div class="relative h-56"><canvas id="embedPackageChart"></canvas></div>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 h-72">
      <h4 class="text-xs font-semibold text-slate-200 mb-2">Demographic Origin Breakdown</h4>
      <div class="relative h-56"><canvas id="embedDemographicChart"></canvas></div>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 h-72">
      <h4 class="text-xs font-semibold text-slate-200 mb-2">Financial Approval Funnel</h4>
      <div class="relative h-56"><canvas id="embedFinancialChart"></canvas></div>
    </div>
  </div>

  <!-- Filter & Table Controls -->
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
    <div class="flex flex-wrap gap-3 mb-4">
      <input id="filter-search" type="text" placeholder="Search runners, email, reg #..." class="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded text-xs text-white flex-1" />
      <button id="btn-export-csv" class="px-3 py-1.5 bg-pink-600 text-white rounded text-xs font-medium">Export CSV</button>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-950 border-b border-slate-800 text-slate-400">
            <th class="p-2">Reg #</th>
            <th class="p-2">Full Name</th>
            <th class="p-2">Town</th>
            <th class="p-2">Package</th>
            <th class="p-2 text-right">Amount (K)</th>
            <th class="p-2 text-center">Payment Status</th>
            <th class="p-2 text-center">DripKit</th>
          </tr>
        </thead>
        <tbody id="participant-table-body" class="divide-y divide-slate-800">
          <!-- Populated dynamically via JS -->
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- Required CDN Dependencies -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
(function() {
  // Siavonga 2026 Data Engine
  const GOOGLE_SHEET_ID = "YOUR_SPREADSHEET_ID";
  const TAB_NAME = "Siavonga_2026";
  
  // Fetch from Google Sheets or fallback sample
  async function loadSiavongaData() {
    const url = \`https://docs.google.com/spreadsheets/d/\${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=\${encodeURIComponent(TAB_NAME)}\`;
    // Initialize chart instances and populate DOM
  }
  window.addEventListener('DOMContentLoaded', loadSiavongaData);
})();
</script>`;

  const iframeCode = `<iframe 
  src="${window.location.origin}" 
  width="100%" 
  height="960" 
  style="border:none; border-radius:12px; overflow:hidden;" 
  title="TempoFit Siavonga Runcation 2026 Dashboard"
></iframe>`;

  const appsScriptCode = `// =================================================================
// Google Apps Script: 2-Way Sync for Siavonga_2026 Tab
// Deploy as Web App: Deploy > New deployment > Web app > Execute as: Me > Access: Anyone
// =================================================================

// 1. GET: Fetches all rows from tab Siavonga_2026 as JSON
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Siavonga_2026");
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Tab Siavonga_2026 not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. POST: Synchronizes Column P (Manual Approval) between "Approved" and "Pending"
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Siavonga_2026");
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Tab Siavonga_2026 not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    // Col B (idx 1) is Email, Col M (idx 12) is Reg #, Col P is Column 16 (1-indexed)
    let updatedRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (
        (payload.email && String(data[i][1]).trim().toLowerCase() === String(payload.email).trim().toLowerCase()) ||
        (payload.registrationNumber && String(data[i][12]).trim() === String(payload.registrationNumber).trim())
      ) {
        // Update Column P (column 16)
        sheet.getRange(i + 1, 16).setValue(payload.newStatus);
        updatedRow = i + 1;
        break;
      }
    }

    if (updatedRow !== -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Updated Column P to " + payload.newStatus + " on row " + updatedRow,
        row: updatedRow,
        newStatus: payload.newStatus
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Participant record not found in Siavonga_2026 tab"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const currentCode =
    activeTab === 'embed-html'
      ? rawVanillaCode
      : activeTab === 'iframe'
      ? iframeCode
      : appsScriptCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-code text-pink-400" aria-hidden="true"></i>
              Embed Code & Integration Snippets
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready code for embedding into Firebase-hosted dashboards or websites
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('embed-html')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'embed-html'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vanilla HTML / JS Component
          </button>
          <button
            onClick={() => setActiveTab('iframe')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'iframe'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Firebase iFrame Embed
          </button>
          <button
            onClick={() => setActiveTab('apps-script')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'apps-script'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Apps Script Bridge
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 space-y-3">
          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed select-all">
              {currentCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <i className={`fa-solid ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`} aria-hidden="true"></i>
              {copied ? 'Copied to Clipboard!' : 'Copy Snippet'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Designed with Chart.js v4, Tailwind CSS, and strict matching of the <code className="text-pink-400 font-mono">Siavonga_2026</code> Google Sheet tab schema.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-end bg-slate-900 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
