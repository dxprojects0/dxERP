
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobTicket, RepairStage } from '../types';

interface RepairState {
  tickets: JobTicket[];
}

const initialState: RepairState = {
  tickets: [],
};

const repairSlice = createSlice({
  name: 'repairs',
  initialState,
  reducers: {
    hydrateRepairs: (state, action: PayloadAction<RepairState>) => {
      state.tickets = action.payload.tickets || [];
    },
    addTicket: (state, action: PayloadAction<JobTicket>) => {
      state.tickets.push(action.payload);
    },
    updateStage: (state, action: PayloadAction<{ id: string; stage: RepairStage }>) => {
      const ticket = state.tickets.find(t => t.id === action.payload.id);
      if (ticket) {
        ticket.stage = action.payload.stage;
        // Maintain compatibility with components using 'status'
        if (ticket.status !== undefined) ticket.status = action.payload.stage;
      }
    },
    // Alias to update both stage and status
    updateTicketStatus: (state, action: PayloadAction<{ id: string; status: RepairStage }>) => {
      const ticket = state.tickets.find(t => t.id === action.payload.id);
      if (ticket) {
        ticket.stage = action.payload.status;
        ticket.status = action.payload.status;
      }
    },
    updateTicket: (state, action: PayloadAction<JobTicket>) => {
      const index = state.tickets.findIndex(t => t.id === action.payload.id);
      if (index !== -1) state.tickets[index] = action.payload;
    },
    deleteTicket: (state, action: PayloadAction<string>) => {
      state.tickets = state.tickets.filter(t => t.id !== action.payload);
    },
    toggleRepairPayment: (state, action: PayloadAction<string>) => {
      const ticket = state.tickets.find(t => t.id === action.payload);
      if (ticket) {
        ticket.paid = !ticket.paid;
        // Maintain compatibility with components using 'paymentStatus'
        if (ticket.paymentStatus !== undefined) {
          ticket.paymentStatus = ticket.paid ? 'Paid' : 'Unpaid';
        }
      }
    },
    // Alias to support specific string status updates
    updatePaymentStatus: (state, action: PayloadAction<{ id: string; status: 'Paid' | 'Unpaid' }>) => {
      const ticket = state.tickets.find(t => t.id === action.payload.id);
      if (ticket) {
        ticket.paid = action.payload.status === 'Paid';
        ticket.paymentStatus = action.payload.status;
      }
    }
  },
});

export const { 
  hydrateRepairs,
  addTicket, 
  updateStage, 
  updateTicketStatus, 
  updateTicket, 
  deleteTicket, 
  toggleRepairPayment,
  updatePaymentStatus 
} = repairSlice.actions;
export default repairSlice.reducer;
