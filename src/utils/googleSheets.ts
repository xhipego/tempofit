import { SiavongaParticipant } from '../types/dashboard';
import { parseSheetRows } from '../data/mockData';

/**
 * Parses CSV text handling quoted values and commas.
 */
export function parseCSV(text: string): string[][] {
  const p: string[][] = [];
  let row: string[] = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }

  if (row.length > 1 || row[0] !== '') {
    p.push(row);
  }

  return p;
}

/**
 * Fetch participant data from Google Sheets API v4 (OAuth or API Key), Google Apps Script, or Public CSV.
 */
export async function fetchGoogleSheetData(options: {
  sheetId?: string;
  tabName?: string;
  apiKey?: string;
  accessToken?: string | null;
  appsScriptUrl?: string;
}): Promise<{ participants: SiavongaParticipant[]; source: string }> {
  const { sheetId, tabName = 'Siavonga_2026', apiKey, accessToken, appsScriptUrl } = options;

  // 1. Authenticated Google Sheets API v4 using OAuth Access Token (Highest priority & real sync)
  if (sheetId && accessToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Google Sheets API error ${res.status}`);
      }

      const json = await res.json();
      if (!json.values || json.values.length === 0) {
        throw new Error(`Tab "${tabName}" in Google Sheet was found, but it has no rows.`);
      }

      return {
        participants: parseSheetRows(json.values),
        source: 'Google Sheets API (Authenticated OAuth)',
      };
    } catch (err: any) {
      console.warn('Authenticated Sheets API fetch failed:', err);
      // Fall through to other methods if needed
      if (!appsScriptUrl && !apiKey) throw err;
    }
  }

  // 2. Google Apps Script Web App JSON payload
  if (appsScriptUrl && appsScriptUrl.trim()) {
    try {
      const res = await fetch(appsScriptUrl.trim());
      if (!res.ok) throw new Error(`Apps Script responded with HTTP ${res.status}`);
      const json = await res.json();

      if (Array.isArray(json)) {
        if (json.length > 0 && Array.isArray(json[0])) {
          return { participants: parseSheetRows(json), source: 'Apps Script (2D Array)' };
        } else if (json.length > 0 && typeof json[0] === 'object') {
          return { participants: json as SiavongaParticipant[], source: 'Apps Script (JSON Objects)' };
        }
      } else if (json.data && Array.isArray(json.data)) {
        if (Array.isArray(json.data[0])) {
          return { participants: parseSheetRows(json.data), source: 'Apps Script (Data Array)' };
        }
        return { participants: json.data as SiavongaParticipant[], source: 'Apps Script (JSON Objects)' };
      }
    } catch (err: any) {
      console.warn('Apps Script fetch failed:', err);
      if (!sheetId) throw new Error(`Failed to load from Apps Script: ${err.message}`);
    }
  }

  // 3. Google Sheets API v4 with API Key
  if (sheetId && apiKey) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}?key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Google Sheets API error ${res.status}`);
      }
      const json = await res.json();
      if (!json.values || json.values.length === 0) {
        throw new Error('No values found in sheet tab: ' + tabName);
      }
      return { participants: parseSheetRows(json.values), source: 'Google Sheets API (API Key)' };
    } catch (err: any) {
      console.warn('API key fetch failed:', err);
    }
  }

  // 4. Public CSV fallback
  if (sheetId) {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`Google Sheet CSV export responded with HTTP ${res.status}`);
      const text = await res.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error('Returned sheet has no participant rows');
      return { participants: parseSheetRows(rows), source: 'Google Sheet CSV' };
    } catch (err: any) {
      console.warn('Google Sheet public CSV export failed:', err);
      throw new Error(`Could not access Google Sheet tab: ${err.message}`);
    }
  }

  throw new Error('Please configure your Google Spreadsheet ID in Sheet Settings.');
}

/**
 * Synchronize Manual Approval (Column P) change directly to the Google Sheets database.
 * Supports:
 * 1. Google Sheets API v4 PUT using OAuth access token (Direct write to Column P in live spreadsheet)
 * 2. Google Apps Script Web App POST
 */
export async function syncManualApprovalToGoogleSheet(options: {
  email: string;
  registrationNumber: string;
  newStatus: 'Approved' | 'Pending';
  sheetId?: string;
  tabName?: string;
  accessToken?: string | null;
  appsScriptUrl?: string;
}): Promise<{
  success: boolean;
  message: string;
  mode: 'oauth_api' | 'apps_script' | 'local_staged';
  updatedCell?: string;
  error?: string;
}> {
  const {
    email,
    registrationNumber,
    newStatus,
    sheetId,
    tabName = 'Siavonga_2026',
    accessToken,
    appsScriptUrl,
  } = options;

  // 1. Direct Authenticated Google Sheets API v4 write via OAuth Access Token
  if (sheetId && accessToken) {
    try {
      // Step A: Find the participant's exact row number in the target tab
      const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}`;
      const getRes = await fetch(getUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!getRes.ok) {
        const errJson = await getRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to read sheet for row lookup (${getRes.status})`);
      }

      const getJson = await getRes.json();
      const rows: any[][] = getJson.values || [];

      // Find matching row by Email (Col B, index 1) or Reg # (Col M, index 12)
      let targetRowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowEmail = row[1] ? String(row[1]).trim().toLowerCase() : '';
        const rowReg = row[12] ? String(row[12]).trim().toLowerCase() : '';

        if (
          (email && rowEmail === email.trim().toLowerCase()) ||
          (registrationNumber && rowReg === registrationNumber.trim().toLowerCase())
        ) {
          targetRowIndex = i + 1; // Google Sheets is 1-indexed (row 1 is header, row 2 is first data row)
          break;
        }
      }

      if (targetRowIndex === -1) {
        throw new Error(
          `Could not find row matching "${email}" (${registrationNumber}) in tab "${tabName}". Please ensure the record exists in your spreadsheet.`
        );
      }

      // Step B: Update Column P (Column index 16) on that exact row
      const targetCell = `P${targetRowIndex}`;
      const updateRange = `${tabName}!${targetCell}`;
      const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`;

      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: updateRange,
          majorDimension: 'ROWS',
          values: [[newStatus]],
        }),
      });

      if (!putRes.ok) {
        const putErr = await putRes.json().catch(() => ({}));
        throw new Error(putErr.error?.message || `Failed to write to cell ${targetCell} (${putRes.status})`);
      }

      return {
        success: true,
        message: `Updated Google Sheet Cell ${targetCell} to "${newStatus}" for ${registrationNumber}`,
        mode: 'oauth_api',
        updatedCell: targetCell,
      };
    } catch (err: any) {
      console.error('Google Sheets API direct write error:', err);
      return {
        success: false,
        message: `Google Sheets update error: ${err.message}`,
        mode: 'oauth_api',
        error: err.message,
      };
    }
  }

  // 2. Google Apps Script Web App POST
  if (appsScriptUrl && appsScriptUrl.trim()) {
    try {
      const response = await fetch(appsScriptUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'updateManualApproval',
          column: 'P',
          email,
          registrationNumber,
          newStatus,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const resJson = await response.json().catch(() => ({ success: true }));
        return {
          success: true,
          message: resJson.message || `Synced Column P to Google Sheet via Apps Script (${newStatus})`,
          mode: 'apps_script',
        };
      }
    } catch (err: any) {
      console.warn('Apps Script sync failed:', err);
    }
  }

  // 3. If no credentials or spreadsheet ID configured
  return {
    success: false,
    message: 'Spreadsheet ID not set or not signed in. Click "Connect Google Sheet" to link your live spreadsheet.',
    mode: 'local_staged',
  };
}

/**
 * Generates and triggers download of participant data as race-day CSV.
 */
export function exportParticipantsToCSV(
  participants: SiavongaParticipant[],
  filename = `TempoFit_Siavonga_2026_Participants_${new Date().toISOString().slice(0, 10)}.csv`
) {
  const headers = [
    'Registration #',
    'Full Name',
    'Email Address',
    'Phone Number',
    'Town / City',
    'TempoFit Member',
    'Category / Package',
    'Amount Paid (K)',
    'Payment Status',
    'Transaction Ref',
    'Mini DripKit Entitlement',
    'Member Verification',
    'Manual Approval',
    'Confirmation Status',
    'Emergency Contact',
    'Medical Conditions',
    'Registration Timestamp',
  ];

  const rows = participants.map((p) => [
    `"${p.registrationNumber.replace(/"/g, '""')}"`,
    `"${p.fullName.replace(/"/g, '""')}"`,
    `"${p.email.replace(/"/g, '""')}"`,
    `"${p.phoneNumber.replace(/"/g, '""')}"`,
    `"${p.townCity.replace(/"/g, '""')}"`,
    `"${p.isTempoFitMember.replace(/"/g, '""')}"`,
    `"${p.categoryPackage.replace(/"/g, '""')}"`,
    `"${p.amountPaid}"`,
    `"${p.paymentVerificationStatus.replace(/"/g, '""')}"`,
    `"${p.transactionReference.replace(/"/g, '""')}"`,
    `"${p.miniDripKitEntitlement.replace(/"/g, '""')}"`,
    `"${p.memberVerificationStatus.replace(/"/g, '""')}"`,
    `"${p.manualApproval.replace(/"/g, '""')}"`,
    `"${p.confirmationStatus.replace(/"/g, '""')}"`,
    `"${p.emergencyContact.replace(/"/g, '""')}"`,
    `"${p.medicalConditions.replace(/"/g, '""')}"`,
    `"${p.timestamp.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
