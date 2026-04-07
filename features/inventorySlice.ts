import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryItem } from '../types';

interface InventoryState {
  items: InventoryItem[];
}

const initialState: InventoryState = {
  items: [],
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    hydrateInventory: (state, action: PayloadAction<InventoryState>) => {
      state.items = action.payload.items || [];
    },
    addItem: (state, action: PayloadAction<Omit<InventoryItem, 'id' | 'usageHistory'>>) => {
      state.items.push({ ...action.payload, id: `inv-${Date.now()}`, usageHistory: [] });
    },
    updateItem: (state, action: PayloadAction<InventoryItem>) => {
      const idx = state.items.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    updateStock: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.quantity = Math.max(0, action.payload.quantity);
    },
    stockIn: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.quantity += Math.max(0, action.payload.quantity);
    },
    deductStock: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        const qty = Math.max(0, action.payload.quantity);
        item.quantity = Math.max(0, item.quantity - qty);
        const lastUsage = item.usageHistory[item.usageHistory.length - 1] || 0;
        if (item.usageHistory.length === 0) item.usageHistory.push(qty);
        else item.usageHistory[item.usageHistory.length - 1] = lastUsage + qty;
      }
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
  },
});

export const { hydrateInventory, addItem, updateItem, updateStock, stockIn, deductStock, deleteItem } = inventorySlice.actions;
export default inventorySlice.reducer;
