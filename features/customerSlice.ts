import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '../types';

interface CustomerState {
  list: Customer[];
}

const initialState: CustomerState = {
  list: [],
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    hydrateCustomers: (state, action: PayloadAction<CustomerState>) => {
      state.list = action.payload.list || [];
    },
    addCustomer: (state, action: PayloadAction<Omit<Customer, 'id'>>) => {
      state.list.push({ ...action.payload, id: `cust-${Date.now()}` });
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.list.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
  },
});

export const { hydrateCustomers, addCustomer, updateCustomer } = customerSlice.actions;
export default customerSlice.reducer;
