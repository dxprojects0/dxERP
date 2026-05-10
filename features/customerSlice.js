import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    list: [],
};
const customerSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {
        hydrateCustomers: (state, action) => {
            state.list = action.payload.list || [];
        },
        addCustomer: (state, action) => {
            state.list.push({ ...action.payload, id: `cust-${Date.now()}` });
        },
        updateCustomer: (state, action) => {
            const index = state.list.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        },
    },
});
export const { hydrateCustomers, addCustomer, updateCustomer } = customerSlice.actions;
export default customerSlice.reducer;
