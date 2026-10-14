export interface SiavongaParticipant {
  timestamp: string; // Col A (0)
  email: string; // Col B (1) Primary Key
  fullName: string; // Col C (2)
  phoneNumber: string; // Col D (3)
  townCity: string; // Col E (4)
  isTempoFitMember: 'Yes' | 'No' | string; // Col F (5)
  categoryPackage: string; // Col G (6) "Free - Member Participation", "K150 - Run Only", "K400 - Run + Mini DripKit"
  transactionReference: string; // Col H (7)
  amountPaid: number; // Col I (8) Numeric (e.g. 0, 150, 400)
  emergencyContact: string; // Col J (9) Name & Number
  medicalConditions: string; // Col K (10)
  memberVerificationStatus: string; // Col L (11) "✅ Verified Member", "⚠️ Member Email Not Found", "N/A - Public"
  registrationNumber: string; // Col M (12) e.g. TF-SIAV-0001
  paymentVerificationStatus: 'Approved' | 'Pending' | 'Rejected' | string; // Col N (13)
  miniDripKitEntitlement: string; // Col O (14) "YES (Socks, Wristband, Buff)", "NO"
  manualApproval: 'Approved' | 'Pending' | string; // Col P (15)
  confirmationStatus: string; // Col Q (16) "Stage 2 Confirmed", "Stage 1 Sent"
}

export interface DashboardMetrics {
  totalRegistrations: number;
  totalRevenue: number;
  verifiedMembersCount: number;
  publicNonMembersCount: number;
  dripKitsCount: number;
  pendingPaymentCount: number;
  approvedPaymentCount: number;
  rejectedPaymentCount: number;
}

export interface FilterState {
  searchQuery: string;
  memberStatus: 'All' | 'Verified' | 'Public';
  paymentStatus: 'All' | 'Approved' | 'Pending' | 'Rejected';
  townCity: string;
  packageCategory: string;
}

export interface GoogleSheetsConfig {
  sheetId: string;
  tabName: string;
  apiKey?: string;
  appsScriptUrl?: string;
  isCustomConnected: boolean;
  lastSyncedAt?: string;
}
