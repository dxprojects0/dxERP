import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { addTransaction, deleteTransaction } from '../features/financeSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';
import Drawer from '../components/Drawer';

const Finance: React.FC = () => {
  const dispatch = useDispatch();
  const transactions = useSelector((state: RootState) => state.finance.transactions);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const [newTx, setNewTx] = useState({
    amount: '',
    type: 'income' as 'income' | 'expense',
    category: '',
    description: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.category) return;
    
    dispatch(addTransaction({
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      category: newTx.category,
      description: newTx.description,
      date: new Date().toISOString()
    }));
    
    setNewTx({ amount: '', type: 'income', category: '', description: '' });
    setIsDrawerOpen(false);
  };

  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;

  // Chart Data Preparation
  const chartData = [
    { name: 'Income', amount: income },
    { name: 'Expenses', amount: expenses },
  ];

  const filteredTransactions = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Visibility</h1>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> New Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <ArrowUpCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">${income.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <ArrowDownCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${expenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
          <h3 className="text-lg font-semibold mb-4">Cash Flow Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Income' ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['all', 'income', 'expense'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors ${
                    filter === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="p-3 text-xs font-medium text-gray-500 uppercase text-right">Amount</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm font-medium text-gray-900">{t.description}</td>
                    <td className="p-3 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {t.category}
                      </span>
                    </td>
                    <td className={`p-3 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => dispatch(deleteTransaction(t.id))}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">No transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Drawer title="Add Transaction" isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'income' })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  newTx.type === 'income' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-600'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  newTx.type === 'expense' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300 text-gray-600'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={newTx.description}
              onChange={e => setNewTx({ ...newTx, description: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Website Payment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={newTx.amount}
              onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              required
              value={newTx.category}
              onChange={e => setNewTx({ ...newTx, category: e.target.value })}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">Select Category</option>
              {newTx.type === 'income' ? (
                <>
                  <option value="Sales">Sales</option>
                  <option value="Services">Services</option>
                  <option value="Investments">Investments</option>
                </>
              ) : (
                <>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Marketing">Marketing</option>
                </>
              )}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors mt-6"
          >
            Save Transaction
          </button>
        </form>
      </Drawer>
    </div>
  );
};

export default Finance;
