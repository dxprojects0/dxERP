import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    transactions: [],
};
const financeSlice = createSlice({
    name: 'finance',
    initialState,
    reducers: {
        hydrateFinance: (state, action) => {
            state.transactions = action.payload.transactions || [];
        },
        addTransaction: (state, action) => {
            state.transactions.push({ ...action.payload, id: `tx-${Date.now()}` });
        },
        deleteTransaction: (state, action) => {
            state.transactions = state.transactions.filter(t => t.id !== action.payload);
        },
    },
});
export const { hydrateFinance, addTransaction, deleteTransaction } = financeSlice.actions;
export default financeSlice.reducer;
