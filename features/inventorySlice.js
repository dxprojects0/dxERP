import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    items: [],
};
const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        hydrateInventory: (state, action) => {
            state.items = action.payload.items || [];
        },
        addItem: (state, action) => {
            state.items.push({ ...action.payload, id: `inv-${Date.now()}`, usageHistory: [] });
        },
        updateItem: (state, action) => {
            const idx = state.items.findIndex((i) => i.id === action.payload.id);
            if (idx !== -1)
                state.items[idx] = action.payload;
        },
        updateStock: (state, action) => {
            const item = state.items.find((i) => i.id === action.payload.id);
            if (item)
                item.quantity = Math.max(0, action.payload.quantity);
        },
        stockIn: (state, action) => {
            const item = state.items.find((i) => i.id === action.payload.id);
            if (item)
                item.quantity += Math.max(0, action.payload.quantity);
        },
        deductStock: (state, action) => {
            const item = state.items.find((i) => i.id === action.payload.id);
            if (item) {
                const qty = Math.max(0, action.payload.quantity);
                item.quantity = Math.max(0, item.quantity - qty);
                const lastUsage = item.usageHistory[item.usageHistory.length - 1] || 0;
                if (item.usageHistory.length === 0)
                    item.usageHistory.push(qty);
                else
                    item.usageHistory[item.usageHistory.length - 1] = lastUsage + qty;
            }
        },
        deleteItem: (state, action) => {
            state.items = state.items.filter((i) => i.id !== action.payload);
        },
    },
});
export const { hydrateInventory, addItem, updateItem, updateStock, stockIn, deductStock, deleteItem } = inventorySlice.actions;
export default inventorySlice.reducer;
