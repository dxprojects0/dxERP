import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Appointment,
  ExpiryReturnLog,
  HealthRecord,
  KOTOrder,
  LedgerEntry,
  ServiceBooking,
  ServiceExpense,
  StaffShift,
  SupplierOrder,
  WarrantyLog,
} from '../types';

interface BusinessState {
  ledger: LedgerEntry[];
  appointments: Appointment[];
  kitchenOrders: KOTOrder[];
  supplierOrders: SupplierOrder[];
  healthRecords: HealthRecord[];
  staffShifts: StaffShift[];
  warrantyLogs: WarrantyLog[];
  serviceBookings: ServiceBooking[];
  serviceExpenses: ServiceExpense[];
  expiryReturns: ExpiryReturnLog[];
}

const initialState: BusinessState = {
  ledger: [],
  appointments: [],
  kitchenOrders: [],
  supplierOrders: [],
  healthRecords: [],
  staffShifts: [],
  warrantyLogs: [],
  serviceBookings: [],
  serviceExpenses: [],
  expiryReturns: [],
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    hydrateBusiness: (state, action: PayloadAction<BusinessState>) => {
      state.ledger = action.payload.ledger || [];
      state.appointments = action.payload.appointments || [];
      state.kitchenOrders = action.payload.kitchenOrders || [];
      state.supplierOrders = action.payload.supplierOrders || [];
      state.healthRecords = action.payload.healthRecords || [];
      state.staffShifts = action.payload.staffShifts || [];
      state.warrantyLogs = action.payload.warrantyLogs || [];
      state.serviceBookings = action.payload.serviceBookings || [];
      state.serviceExpenses = action.payload.serviceExpenses || [];
      state.expiryReturns = action.payload.expiryReturns || [];
    },
    addLedgerEntry: (state, action: PayloadAction<LedgerEntry>) => {
      state.ledger.push(action.payload);
    },
    updateLedgerPayment: (state, action: PayloadAction<{ id: string; paidAmount: number }>) => {
      const entry = state.ledger.find((e) => e.id === action.payload.id);
      if (entry) {
        const remaining = Math.max(0, entry.amount - entry.paid);
        entry.paid += Math.min(remaining, Math.max(0, action.payload.paidAmount));
      }
    },

    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload);
    },
    updateAppointmentStatus: (state, action: PayloadAction<{ id: string; status: Appointment['status'] }>) => {
      const appt = state.appointments.find((a) => a.id === action.payload.id);
      if (appt) appt.status = action.payload.status;
    },

    addKitchenOrder: (state, action: PayloadAction<KOTOrder>) => {
      state.kitchenOrders.push(action.payload);
    },
    updateKitchenStatus: (state, action: PayloadAction<{ id: string; status: KOTOrder['status'] }>) => {
      const order = state.kitchenOrders.find((o) => o.id === action.payload.id);
      if (order) order.status = action.payload.status;
    },
    deleteKitchenOrder: (state, action: PayloadAction<string>) => {
      state.kitchenOrders = state.kitchenOrders.filter((order) => order.id !== action.payload);
    },

    addSupplierOrder: (state, action: PayloadAction<SupplierOrder>) => {
      state.supplierOrders.push(action.payload);
    },
    updateSupplierOrderStatus: (state, action: PayloadAction<{ id: string; status: SupplierOrder['status'] }>) => {
      const order = state.supplierOrders.find((o) => o.id === action.payload.id);
      if (order) order.status = action.payload.status;
    },

    addHealthRecord: (state, action: PayloadAction<HealthRecord>) => {
      state.healthRecords.push(action.payload);
    },
    updateHealthRecord: (state, action: PayloadAction<HealthRecord>) => {
      const idx = state.healthRecords.findIndex((record) => record.id === action.payload.id);
      if (idx !== -1) state.healthRecords[idx] = action.payload;
    },

    addStaffShift: (state, action: PayloadAction<StaffShift>) => {
      state.staffShifts.push(action.payload);
    },
    updateStaffShift: (state, action: PayloadAction<StaffShift>) => {
      const idx = state.staffShifts.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) state.staffShifts[idx] = action.payload;
    },

    addWarrantyLog: (state, action: PayloadAction<WarrantyLog>) => {
      state.warrantyLogs.push(action.payload);
    },

    addServiceBooking: (state, action: PayloadAction<ServiceBooking>) => {
      state.serviceBookings.push(action.payload);
    },
    updateServiceBookingStatus: (state, action: PayloadAction<{ id: string; status: ServiceBooking['status'] }>) => {
      const booking = state.serviceBookings.find((b) => b.id === action.payload.id);
      if (booking) booking.status = action.payload.status;
    },

    addServiceExpense: (state, action: PayloadAction<ServiceExpense>) => {
      state.serviceExpenses.push(action.payload);
    },

    addExpiryReturn: (state, action: PayloadAction<ExpiryReturnLog>) => {
      state.expiryReturns.push(action.payload);
    },
  },
});

export const {
  hydrateBusiness,
  addLedgerEntry,
  updateLedgerPayment,
  addAppointment,
  updateAppointmentStatus,
  addKitchenOrder,
  updateKitchenStatus,
  deleteKitchenOrder,
  addSupplierOrder,
  updateSupplierOrderStatus,
  addHealthRecord,
  updateHealthRecord,
  addStaffShift,
  updateStaffShift,
  addWarrantyLog,
  addServiceBooking,
  updateServiceBookingStatus,
  addServiceExpense,
  addExpiryReturn,
} = businessSlice.actions;

export default businessSlice.reducer;
