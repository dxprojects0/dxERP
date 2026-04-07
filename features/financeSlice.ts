import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../types';

interface FinanceState {
  transactions: Transaction[];
}

const initialState: FinanceState = {
  transactions: [],
};

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    hydrateFinance: (state, action: PayloadAction<FinanceState>) => {
      state.transactions = action.payload.transactions || [];
    },
    addTransaction: (state, action: PayloadAction<Omit<Transaction, 'id'>>) => {
      state.transactions.push({ ...action.payload, id: `tx-${Date.now()}` });
    },
    deleteTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(t => t.id !== action.payload);
    },
  },
});

export const { hydrateFinance, addTransaction, deleteTransaction } = financeSlice.actions;
export default financeSlice.reducer;
