import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice } from '../types';

interface POSState {
  invoices: Invoice[];
}

const initialState: POSState = {
  invoices: [],
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    hydratePos: (state, action: PayloadAction<POSState>) => {
      state.invoices = action.payload.invoices || [];
    },
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.invoices.push(action.payload);
    },
    deleteInvoice: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter(inv => inv.id !== action.payload);
    },
    togglePaymentStatus: (state, action: PayloadAction<string>) => {
      const inv = state.invoices.find(i => i.id === action.payload);
      if (inv) inv.paid = !inv.paid;
    }
  },
});

export const { hydratePos, addInvoice, deleteInvoice, togglePaymentStatus } = posSlice.actions;
export default posSlice.reducer;
