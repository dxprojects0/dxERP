import type { UserPlan, UserRole } from './utils/plans';

export type ToolFeature =
  | 'billing'
  | 'inventory'
  | 'ledger'
  | 'ordering'
  | 'reports'
  | 'expiry'
  | 'appointments'
  | 'ehr'
  | 'kitchen'
  | 'staff'
  | 'repairTickets'
  | 'warranty'
  | 'jobBooking'
  | 'expenses';

export type RepairStage =
  | 'Received'
  | 'Diagnose'
  | 'Diagnosing'
  | 'In Process'
  | 'In Progress'
  | 'Ready'
  | 'Delivered';
export type RepairStatus = RepairStage;
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Split';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  costPrice: number;
  sellingPrice: number;
  usageHistory: number[];
  supplier?: string;
  batchNo?: string;
  expiryDate?: string;
  weightKg?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

export interface Invoice {
  id: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  paymentMode: PaymentMode;
  paid: boolean;
}

export interface LedgerEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  amount: number;
  paid: number;
  date: string;
  dueDate?: string;
  items: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  status: 'Booked' | 'Visited' | 'Cancelled';
  notes?: string;
}

export interface HealthRecord {
  id: string;
  patientName: string;
  patientPhone: string;
  diagnosisNotes: string;
  prescriptionUrl?: string;
  followUpDate?: string;
  visitDate: string;
}

export interface KOTOrder {
  id: string;
  table: string;
  items: { name: string; qty: number }[];
  status: 'New' | 'Preparing' | 'Ready' | 'Delivered';
  startTime: string;
}

export interface StaffShift {
  id: string;
  staffName: string;
  date: string;
  shift: 'Morning' | 'Evening' | 'Full Day';
  attendance: 'Present' | 'Absent';
  overtimeHours: number;
}

export interface SupplierOrder {
  id: string;
  supplierName: string;
  itemSummary: string;
  totalCost: number;
  linkedItemId?: string;
  receivedQty?: number;
  status: 'Pending' | 'Received';
  createdAt: string;
}

export interface ExpiryReturnLog {
  id: string;
  itemName: string;
  batchNo?: string;
  qty: number;
  returnDate: string;
  supplierName?: string;
}

export interface WarrantyLog {
  id: string;
  customerName: string;
  productName: string;
  startDate: string;
  endDate: string;
  coveredParts: string;
  claimHistory: string;
  linkedJobId?: string;
}

export interface ServiceBooking {
  id: string;
  serviceType: string;
  location: string;
  date: string;
  time: string;
  technician: string;
  status: 'Booked' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface ServiceExpense {
  id: string;
  jobId?: string;
  date: string;
  travelExpense: number;
  materialCost: number;
  notes?: string;
}

export interface JobTicket {
  id: string;
  stage: RepairStage;
  status?: RepairStage;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  deviceName?: string;
  device: { category?: string; brand: string; model: string; imei: string };
  problemDescription?: string;
  problem: string;
  estimatedCost: number;
  finalAmount?: number;
  approvalRequired?: boolean;
  diagnosisNotes?: string;
  technician?: string;
  paymentMode?: PaymentMode;
  paymentStatus?: 'Paid' | 'Unpaid';
  paid: boolean;
  createdAt: string;
  dueDate?: string;
  accessories?: string[];
  partsUsed?: { name: string; cost: number; quantity?: number }[];
}

export interface ConfigState {
  shopName: string;
  ownerName: string;
  phoneNumber: string;
  hasSeenPrompt: boolean;
  selectedProfessionId: string | null;
  onboardingCompleted: boolean;
  authResolved: boolean;
  customTools: ToolFeature[];
  firstUseAt: string | null;
  lastLoginPromptDate: string | null;
  isAuthenticated: boolean;
  authUid: string | null;
  authEmail: string | null;
  authDisplayName: string | null;
  authMethod: 'google' | 'phone' | 'email' | null;
  role: UserRole;
  isAdmin: boolean;
  plan: UserPlan;
  proStartedAt: string | null;
  lastCloudSyncAt: string | null;
  tasks: { id: string; title: string; done: boolean; createdAt: string }[];
  themeMode: 'light' | 'dark';
  themePalette: string;
}
