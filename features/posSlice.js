import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    invoices: [],
};
const posSlice = createSlice({
    name: 'pos',
    initialState,
    reducers: {
        hydratePos: (state, action) => {
            state.invoices = action.payload.invoices || [];
        },
        addInvoice: (state, action) => {
            state.invoices.push(action.payload);
        },
        deleteInvoice: (state, action) => {
            state.invoices = state.invoices.filter(inv => inv.id !== action.payload);
        },
        togglePaymentStatus: (state, action) => {
            const inv = state.invoices.find(i => i.id === action.payload);
            if (inv)
                inv.paid = !inv.paid;
        }
    },
});
export const { hydratePos, addInvoice, deleteInvoice, togglePaymentStatus } = posSlice.actions;
export default posSlice.reducer;
