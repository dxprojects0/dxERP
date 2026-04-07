import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addItem, deleteItem, stockIn, deductStock } from '../features/inventorySlice';
import Drawer from '../components/Drawer';
import { AlertTriangle, Plus, Search } from 'lucide-react';

const Inventory: React.FC = () => {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.inventory.items);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    minStockLevel: 5,
    costPrice: 0,
    sellingPrice: 0,
    supplier: '',
    batchNo: '',
    expiryDate: '',
  });

  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [items, searchTerm]);

  const lowStock = items.filter((i) => i.quantity <= i.minStockLevel).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      addItem({
        ...newItem,
        supplier: newItem.supplier || undefined,
        batchNo: newItem.batchNo || undefined,
        expiryDate: newItem.expiryDate || undefined,
      }),
    );
    setNewItem({
      name: '',
      sku: '',
      category: '',
      quantity: 0,
      minStockLevel: 5,
      costPrice: 0,
      sellingPrice: 0,
      supplier: '',
      batchNo: '',
      expiryDate: '',
    });
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Inventory Control</h1>
          <p className="text-slate-500 font-medium">Item master, stock movement, supplier mapping, and margin check.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black flex items-center gap-2">
            <AlertTriangle size={14} /> {lowStock} LOW STOCK
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-blue-700"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU, supplier"
            className="w-full outline-none font-medium"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Batch/Expiry</th>
                <th className="p-3">Cost vs Sell</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.quantity <= item.minStockLevel;
                const margin = item.sellingPrice - item.costPrice;
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500">SKU: {item.sku} | {item.category}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 border rounded" onClick={() => dispatch(deductStock({ id: item.id, quantity: 1 }))}>-</button>
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>{item.quantity}</span>
                        <button className="px-2 py-1 border rounded" onClick={() => dispatch(stockIn({ id: item.id, quantity: 1 }))}>+</button>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{item.supplier || '-'}</td>
                    <td className="p-3 text-sm">{item.batchNo || '-'} {item.expiryDate ? `| ${item.expiryDate}` : ''}</td>
                    <td className="p-3 text-sm">₹ {item.costPrice} / ₹ {item.sellingPrice} <span className="text-green-700 font-semibold">(₹ {margin})</span></td>
                    <td className="p-3">
                      <button className="text-red-600 text-sm" onClick={() => dispatch(deleteItem(item.id))}>Delete</button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-400" colSpan={6}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer title="Add Inventory Item" isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <form onSubmit={handleAdd} className="space-y-3">
          <input required className="w-full border p-2 rounded" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input required className="w-full border p-2 rounded" placeholder="SKU" value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} />
            <input required className="w-full border p-2 rounded" placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="0" required className="w-full border p-2 rounded" placeholder="Stock" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) || 0 })} />
            <input type="number" min="0" required className="w-full border p-2 rounded" placeholder="Low stock alert" value={newItem.minStockLevel} onChange={(e) => setNewItem({ ...newItem, minStockLevel: Number(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="0" required className="w-full border p-2 rounded" placeholder="Cost price" value={newItem.costPrice} onChange={(e) => setNewItem({ ...newItem, costPrice: Number(e.target.value) || 0 })} />
            <input type="number" min="0" required className="w-full border p-2 rounded" placeholder="Selling price" value={newItem.sellingPrice} onChange={(e) => setNewItem({ ...newItem, sellingPrice: Number(e.target.value) || 0 })} />
          </div>
          <input className="w-full border p-2 rounded" placeholder="Supplier" value={newItem.supplier} onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="w-full border p-2 rounded" placeholder="Batch number" value={newItem.batchNo} onChange={(e) => setNewItem({ ...newItem, batchNo: e.target.value })} />
            <input type="date" className="w-full border p-2 rounded" value={newItem.expiryDate} onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })} />
          </div>
          <button className="w-full bg-primary text-white py-2 rounded font-bold">Save Item</button>
        </form>
      </Drawer>
    </div>
  );
};

export default Inventory;
