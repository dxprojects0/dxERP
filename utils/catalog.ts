import { ToolFeature } from '../types';

export interface Profession {
  id: string;
  name: string;
  description: string;
  accent: string;
}

export interface ToolDefinition {
  id: ToolFeature;
  label: string;
  category: 'Manage Money' | 'Manage Products' | 'Services' | 'Workflow' | 'Compliance';
  description: string;
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'kirana',
    name: 'Kirana / General Store',
    description: 'Fast billing, credit tracking, stock control.',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'Batch expiry, prescriptions, and compliance logs.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'clinic',
    name: 'Clinic / Doctor',
    description: 'Appointments, patient history, and visit workflow.',
    accent: 'from-rose-500 to-orange-500',
  },
  {
    id: 'cafe',
    name: 'Cafe / Restaurant',
    description: 'Kitchen display, inventory usage, staff shifts.',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    id: 'electronics',
    name: 'Repair Shop',
    description: 'Job tickets, parts tracking, warranty logs.',
    accent: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'service',
    name: 'Service Professional',
    description: 'Booking, on-site billing, and expense capture.',
    accent: 'from-slate-600 to-slate-800',
  },
];

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { id: 'billing', label: 'POS Billing', category: 'Manage Money', description: 'Invoice and collect quickly.' },
  { id: 'ledger', label: 'Credit Ledger', category: 'Manage Money', description: 'Track unpaid customer balances.' },
  { id: 'reports', label: 'Daily Reports', category: 'Manage Money', description: 'Profit and transaction summaries.' },
  { id: 'expenses', label: 'Expense Log', category: 'Manage Money', description: 'Capture cost and margin impact.' },
  { id: 'inventory', label: 'Inventory', category: 'Manage Products', description: 'Stock, reorder levels, and updates.' },
  { id: 'ordering', label: 'Supplier Orders', category: 'Manage Products', description: 'PO status and stock-in flow.' },
  { id: 'expiry', label: 'Expiry Tracking', category: 'Compliance', description: 'Near-expiry and return records.' },
  { id: 'appointments', label: 'Appointments', category: 'Workflow', description: 'Time slot and visit queue planning.' },
  { id: 'ehr', label: 'Health Records', category: 'Compliance', description: 'Patient notes and follow-up data.' },
  { id: 'kitchen', label: 'Kitchen Display', category: 'Workflow', description: 'Order preparation board for teams.' },
  { id: 'staff', label: 'Staff Roster', category: 'Workflow', description: 'Attendance and shift assignment.' },
  { id: 'repairTickets', label: 'Job Tickets', category: 'Services', description: 'Service lifecycle from intake to delivery.' },
  { id: 'warranty', label: 'Warranty Logs', category: 'Compliance', description: 'Coverage and claim history.' },
  { id: 'jobBooking', label: 'Instant Booking', category: 'Services', description: 'Schedule jobs from customer calls.' },
];

export const PRESET_TOOLS: Record<string, ToolFeature[]> = {
  kirana: ['billing', 'inventory', 'ledger', 'ordering', 'reports'],
  pharmacy: ['billing', 'inventory', 'expiry', 'ordering', 'reports'],
  clinic: ['appointments', 'ehr', 'billing', 'reports'],
  cafe: ['billing', 'inventory', 'kitchen', 'staff', 'reports'],
  electronics: ['repairTickets', 'inventory', 'warranty', 'reports'],
  service: ['jobBooking', 'billing', 'expenses', 'reports'],
};
