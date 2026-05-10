import { createSlice } from '@reduxjs/toolkit';
const initialState = {
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
        hydrateBusiness: (state, action) => {
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
        addLedgerEntry: (state, action) => {
            state.ledger.push(action.payload);
        },
        updateLedgerPayment: (state, action) => {
            const entry = state.ledger.find((e) => e.id === action.payload.id);
            if (entry) {
                const remaining = Math.max(0, entry.amount - entry.paid);
                entry.paid += Math.min(remaining, Math.max(0, action.payload.paidAmount));
            }
        },
        addAppointment: (state, action) => {
            state.appointments.push(action.payload);
        },
        updateAppointmentStatus: (state, action) => {
            const appt = state.appointments.find((a) => a.id === action.payload.id);
            if (appt)
                appt.status = action.payload.status;
        },
        addKitchenOrder: (state, action) => {
            state.kitchenOrders.push(action.payload);
        },
        updateKitchenStatus: (state, action) => {
            const order = state.kitchenOrders.find((o) => o.id === action.payload.id);
            if (order)
                order.status = action.payload.status;
        },
        deleteKitchenOrder: (state, action) => {
            state.kitchenOrders = state.kitchenOrders.filter((order) => order.id !== action.payload);
        },
        addSupplierOrder: (state, action) => {
            state.supplierOrders.push(action.payload);
        },
        updateSupplierOrderStatus: (state, action) => {
            const order = state.supplierOrders.find((o) => o.id === action.payload.id);
            if (order)
                order.status = action.payload.status;
        },
        addHealthRecord: (state, action) => {
            state.healthRecords.push(action.payload);
        },
        updateHealthRecord: (state, action) => {
            const idx = state.healthRecords.findIndex((record) => record.id === action.payload.id);
            if (idx !== -1)
                state.healthRecords[idx] = action.payload;
        },
        addStaffShift: (state, action) => {
            state.staffShifts.push(action.payload);
        },
        updateStaffShift: (state, action) => {
            const idx = state.staffShifts.findIndex((s) => s.id === action.payload.id);
            if (idx !== -1)
                state.staffShifts[idx] = action.payload;
        },
        addWarrantyLog: (state, action) => {
            state.warrantyLogs.push(action.payload);
        },
        addServiceBooking: (state, action) => {
            state.serviceBookings.push(action.payload);
        },
        updateServiceBookingStatus: (state, action) => {
            const booking = state.serviceBookings.find((b) => b.id === action.payload.id);
            if (booking)
                booking.status = action.payload.status;
        },
        addServiceExpense: (state, action) => {
            state.serviceExpenses.push(action.payload);
        },
        addExpiryReturn: (state, action) => {
            state.expiryReturns.push(action.payload);
        },
    },
});
export const { hydrateBusiness, addLedgerEntry, updateLedgerPayment, addAppointment, updateAppointmentStatus, addKitchenOrder, updateKitchenStatus, deleteKitchenOrder, addSupplierOrder, updateSupplierOrderStatus, addHealthRecord, updateHealthRecord, addStaffShift, updateStaffShift, addWarrantyLog, addServiceBooking, updateServiceBookingStatus, addServiceExpense, addExpiryReturn, } = businessSlice.actions;
export default businessSlice.reducer;
