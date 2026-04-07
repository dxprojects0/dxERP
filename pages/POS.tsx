import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addInvoice } from '../features/posSlice';
import { addItem, deductStock, updateItem } from '../features/inventorySlice';
import { addKitchenOrder, addLedgerEntry } from '../features/businessSlice';
import { Check, Download, MessageCircle, Plus, Search, Share2, Trash2 } from 'lucide-react';
import { PaymentMode } from '../types';
import { emitToast } from '../utils/toast';
import Modal from '../components/Modal';
import { printHtmlDocument } from '../utils/print';

const placeholderSteps = [
  'Search Mobile products...',
  'Search Grocery products...',
  'Search Pharmacy products...',
  'Search Cafe products...',
];

const POS: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.inventory.items);
  const shopName = useSelector((state: RootState) => state.config.shopName);
  const profession = useSelector((state: RootState) => state.config.selectedProfessionId);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cart, setCart] = useState<{ productId: string; qty: number }[]>([]);
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showCartActions, setShowCartActions] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState(placeholderSteps[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paid, setPaid] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    quantity: '',
    weightKg: '',
    costPrice: '',
    sellingPrice: '',
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let step = 0;
    let char = 0;
    let deleting = false;
    const timer = setInterval(() => {
      const full = placeholderSteps[step];
      if (!deleting) {
        char += 1;
        if (char >= full.length) deleting = true;
      } else {
        char -= 1;
        if (char <= 0) {
          deleting = false;
          step = (step + 1) % placeholderSteps.length;
        }
      }
      const current = placeholderSteps[step].slice(0, Math.max(1, char));
      setSearchPlaceholder(current);
    }, 75);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(
    () => (products || []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const cartItems = useMemo(() => {
    return cart
      .map((c) => {
        const prod = (products || []).find((x) => x.id === c.productId);
        if (!prod) return null;
        return { ...prod, qty: c.qty };
      })
      .filter(Boolean) as Array<(typeof products)[number] & { qty: number }>;
  }, [cart, products]);

  const subtotal = cartItems.reduce((acc, p) => acc + p.sellingPrice * p.qty, 0);
  const total = Math.round(subtotal);
  const hasExpired = cartItems.some((item) => item.expiryDate && new Date(item.expiryDate) < new Date());

  const addToCart = (id: string) => {
    setCart((prev) => {
      const found = prev.find((p) => p.productId === id);
      if (found) return prev.map((p) => (p.productId === id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { productId: id, qty: 1 }];
    });
    emitToast({ variant: 'success', message: 'Product added to bill.' });
  };

  const addProductFromCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;
    dispatch(
      addItem({
        name: newProduct.name.trim(),
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        category: newProduct.category.trim() || 'General',
        quantity: Number(newProduct.quantity) || 0,
        minStockLevel: 0,
        costPrice: Number(newProduct.costPrice) || 0,
        sellingPrice: Number(newProduct.sellingPrice) || 0,
        weightKg: Number(newProduct.weightKg) || 0,
      }),
    );
    setNewProduct({ name: '', category: '', quantity: '', weightKg: '', costPrice: '', sellingPrice: '' });
    setShowAddProduct(false);
    emitToast({ variant: 'success', message: 'Product added to inventory.' });
  };

  const buildReceiptText = (invoice: any) => {
    const itemRows = invoice.items.map((i: any) => `${i.name} x${i.quantity} @ ₹ ${i.price}`).join('\n');
    return `*${shopName || 'DhandaX Tools'}*\nDate: ${new Date(invoice.date).toLocaleString()}\nCustomer: ${invoice.customerName || '-'}\nContact: ${invoice.customerPhone || '-'}\n\n${itemRows}\n\nTotal: ₹ ${invoice.total}\nPaid by: ${invoice.paymentMode}\nStatus: ${invoice.paid ? 'Paid' : 'Udhaar'}\n\nThank for visiting come again !!`;
  };

  const handleCheckout = () => {
    if (cart.length === 0 || hasExpired) return;
    const invId = `INV-${Date.now().toString().slice(-6)}`;
    const invoice = {
      id: invId,
      date: new Date().toISOString(),
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      items: cartItems.map((i) => ({ name: i.name, price: i.sellingPrice, quantity: i.qty })),
      total,
      paymentMode,
      paid,
    };

    dispatch(addInvoice(invoice));
    cart.forEach((item) => dispatch(deductStock({ id: item.productId, quantity: item.qty })));

    if (!paid && customerName && customerPhone) {
      dispatch(
        addLedgerEntry({
          id: `UD-${Date.now()}`,
          customerName,
          customerPhone,
          amount: total,
          paid: 0,
          date: new Date().toLocaleDateString(),
          dueDate: dueDate || undefined,
          items: invoice.items.map((i) => i.name).join(', '),
        }),
      );
    }

    if (profession === 'cafe') {
      dispatch(
        addKitchenOrder({
          id: `KOT-${invId}`,
          table: 'Walk-in',
          items: invoice.items.map((i) => ({ name: i.name, qty: i.quantity })),
          status: 'New',
          startTime: new Date().toISOString(),
        }),
      );
    }

    setLastInvoice(invoice);
    setShowSuccess(true);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDueDate('');
    setPaid(true);
    setPaymentMode('Cash');
    setSelectedCartIds([]);
    emitToast({ variant: 'success', message: 'Bill completed successfully.' });
  };

  const removeSelectedFromCart = () => {
    if (selectedCartIds.length === 0) return;
    setCart((curr) => curr.filter((item) => !selectedCartIds.includes(item.productId)));
    setSelectedCartIds([]);
    setShowCartActions(false);
    emitToast({ variant: 'success', message: 'Selected items removed.' });
  };

  const shareReceipt = () => {
    if (!lastInvoice) return;
    const text = buildReceiptText(lastInvoice);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const downloadPdf = () => {
    if (!lastInvoice) return;
    const itemRows = (lastInvoice.items || [])
      .map(
        (item: any) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">Rs ${item.price}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">Rs ${item.price * item.quantity}</td>
          </tr>
        `,
      )
      .join('');
    const printed = printHtmlDocument(
      `Receipt ${lastInvoice.id}`,
      `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
          <div>
            <h2 style="margin:0;color:#1e90ff;">${shopName || 'DhandaX Tools'}</h2>
            <p style="margin:6px 0 0 0;color:#64748b;">Invoice ${lastInvoice.id}</p>
          </div>
          <div style="text-align:right;font-size:13px;color:#334155;">
            <div><strong>Date:</strong> ${new Date(lastInvoice.date).toLocaleString()}</div>
            <div><strong>Customer:</strong> ${lastInvoice.customerName || '-'}</div>
            <div><strong>Phone:</strong> ${lastInvoice.customerPhone || '-'}</div>
          </div>
        </div>
        <table style="width:100%;margin-top:16px;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="text-align:left;padding:8px;border-bottom:1px solid #cbd5e1;">Item</th>
              <th style="text-align:right;padding:8px;border-bottom:1px solid #cbd5e1;">Qty</th>
              <th style="text-align:right;padding:8px;border-bottom:1px solid #cbd5e1;">Price</th>
              <th style="text-align:right;padding:8px;border-bottom:1px solid #cbd5e1;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="margin-top:14px;display:grid;gap:6px;justify-content:end;text-align:right;font-size:13px;">
          <div><strong>Payment:</strong> ${lastInvoice.paymentMode}</div>
          <div><strong>Status:</strong> ${lastInvoice.paid ? 'Paid' : 'Udhaar'}</div>
          <div style="font-size:18px;"><strong>Total: Rs ${lastInvoice.total}</strong></div>
        </div>
      `,
      700,
      900,
    );
    if (!printed) {
      emitToast({ variant: 'error', message: 'Popup blocked. Allow popups and retry.' });
    }
  };

  return (
    <div className="space-y-5 overflow-x-hidden pb-24 md:pb-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5 items-start">
        <div className="bg-surface rounded-3xl border border-app flex flex-col overflow-hidden min-w-0">
          <div className="p-4 border-b border-app flex items-center gap-2 min-w-0">
            <Search size={16} className="text-primary-app" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full min-w-0 outline-none bg-app border border-app rounded-xl px-3 py-2 text-sm" placeholder={searchPlaceholder} />
            {!isMobile && (
              <button onClick={() => setShowCartActions((v) => !v)} className="h-9 w-9 rounded-xl border border-app text-sm">
                ...
              </button>
            )}
          </div>
          {!isMobile && showCartActions && (
            <div className="px-4 pt-3 pb-1 flex gap-2">
              <button onClick={removeSelectedFromCart} className="text-xs px-3 py-2 rounded-lg border border-app">
                Remove selected ({selectedCartIds.length})
              </button>
              <button
                onClick={() => {
                  setCart([]);
                  setSelectedCartIds([]);
                  setShowCartActions(false);
                  emitToast({ variant: 'success', message: 'Cart cleared.' });
                }}
                className="text-xs px-3 py-2 rounded-lg border border-[var(--danger)] text-[color:var(--danger)]"
              >
                Clear cart
              </button>
            </div>
          )}
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto overflow-x-hidden max-h-[48vh] md:max-h-[58vh]">
            {(filteredProducts || []).map((p) => (
              <button key={p.id} onClick={() => addToCart(p.id)} className="border border-app bg-surface rounded-2xl p-3 text-left hover:border-[var(--primary)] hover:bg-[color:var(--primary)]/10 transition-all">
                <div className="text-[10px] text-subtle uppercase tracking-wide">{p.category}</div>
                <div className="font-bold">{p.name}</div>
                <div className="text-primary-app font-black mt-2">₹ {p.sellingPrice}</div>
                <div className="mt-2">
                  {editingProductId === p.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={editingPrice}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="w-full border border-app rounded-lg px-2 py-1 text-xs bg-transparent"
                        placeholder="New price"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = Number(editingPrice);
                          if (!Number.isFinite(next) || next < 0) {
                            emitToast({ variant: 'error', message: 'Enter valid price.' });
                            return;
                          }
                          dispatch(updateItem({ ...p, sellingPrice: next }));
                          setEditingProductId(null);
                          setEditingPrice('');
                          emitToast({ variant: 'success', message: 'Product price updated.' });
                        }}
                        className="px-2 py-1 text-xs rounded-lg bg-primary-app text-white"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProductId(p.id);
                        setEditingPrice(String(p.sellingPrice));
                      }}
                      className="text-[11px] px-2 py-1 rounded-lg border border-app"
                    >
                      Update Price
                    </button>
                  )}
                </div>
              </button>
            ))}
            {(filteredProducts || []).length === 0 && <div className="text-sm text-subtle col-span-full">No products found.</div>}
          </div>
        </div>

        <div className="bg-surface rounded-3xl border border-app flex flex-col min-w-0">
          <div className="p-4 border-b border-app flex items-center justify-between">
            <h3 className="font-black">POS Checkout</h3>
            {isMobile && (
              <button onClick={() => setShowAddProduct(true)} className="h-8 w-8 rounded-full bg-primary-app text-white flex items-center justify-center">
                <Plus size={16} />
              </button>
            )}
          </div>

          <form onSubmit={addProductFromCheckout} className="hidden md:grid p-4 border-b border-app grid-cols-2 gap-2 bg-app/50">
            <input required placeholder="Product name" className="col-span-2 border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
            <input placeholder="Category" className="border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
            <input type="number" min="0" placeholder="Qty" className="border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })} />
            <input type="number" min="0" step="0.01" placeholder="Weight (kg)" className="border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={newProduct.weightKg} onChange={(e) => setNewProduct({ ...newProduct, weightKg: e.target.value })} />
            <input type="number" min="0" placeholder="Cost price" className="border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={newProduct.costPrice} onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })} />
            <input type="number" min="0" placeholder="Selling price" className="border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={newProduct.sellingPrice} onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })} />
            <button className="col-span-2 bg-primary-app text-white py-2 rounded-xl font-bold text-sm">Add Product</button>
          </form>

          <div className="p-4 space-y-2 max-h-[35vh] md:max-h-[250px] overflow-y-auto overflow-x-hidden">
            {(cartItems || []).map((item) => (
              <div key={item.id} className="flex justify-between items-center gap-2 p-2 border border-app rounded-xl">
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <input
                      type="checkbox"
                      checked={selectedCartIds.includes(item.id)}
                      onChange={(e) =>
                        setSelectedCartIds((prev) =>
                          e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                        )
                      }
                    />
                  )}
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-subtle">₹ {item.sellingPrice} x {item.qty}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCart((curr) => curr.map((i) => (i.productId === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i)))} className="h-7 w-7 rounded border border-app">-</button>
                  <button type="button" onClick={() => setCart((curr) => curr.map((i) => (i.productId === item.id ? { ...i, qty: i.qty + 1 } : i)))} className="h-7 w-7 rounded border border-app">+</button>
                  <button type="button" onClick={() => { setCart((c) => c.filter((i) => i.productId !== item.id)); emitToast({ variant: 'success', message: 'Item removed from bill.' }); }} className="text-subtle hover:text-[color:var(--danger)]"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {cartItems.length === 0 && <p className="text-sm text-subtle">No items in cart.</p>}
          </div>

          <div className="p-4 border-t border-app space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input placeholder="Customer name" className="border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input placeholder="Customer phone" className="border border-app rounded-xl px-3 py-2 text-sm outline-none bg-transparent" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Cash', 'UPI', 'Card', 'Split'] as PaymentMode[]).map((mode) => (
                <button key={mode} onClick={() => setPaymentMode(mode)} type="button" className={`border rounded-xl p-2 text-xs font-bold ${paymentMode === mode ? 'border-[var(--primary)] text-primary-app bg-[color:var(--primary)]/10' : 'border-app text-subtle'}`}>
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-2 bg-app rounded-xl border border-app">
              <span className="font-semibold text-sm">Payment Status</span>
              <button onClick={() => setPaid((v) => !v)} type="button" className={`px-3 py-1 rounded text-xs font-bold ${paid ? 'bg-[color:var(--success)]/15 text-[color:var(--success)]' : 'bg-[color:var(--danger)]/15 text-[color:var(--danger)]'}`}>
                {paid ? 'Paid' : 'Udhaar'}
              </button>
            </div>

            {!paid && <input type="date" className="border border-[var(--danger)] rounded-xl px-3 py-2 w-full text-sm bg-transparent" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
            {hasExpired && <div className="text-xs text-[color:var(--danger)] font-bold">Expired item in cart. Remove it to bill.</div>}

            <div className="flex justify-between items-center">
              <span className="text-subtle">Total</span>
              <span className="text-2xl font-black text-primary-app">₹ {total}</span>
            </div>
            <button onClick={handleCheckout} disabled={cartItems.length === 0 || hasExpired} className="w-full bg-primary-app text-white py-3 rounded-xl font-black disabled:opacity-60">
              <Check size={16} className="inline mr-1" /> Complete Bill
            </button>
          </div>
        </div>
      </div>

      {showAddProduct && (
        <Modal
          isOpen={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          title="Add Product"
          maxWidth="30rem"
          closeOnBackdrop
        >
          <form onSubmit={addProductFromCheckout} className="space-y-2">
            <input required placeholder="Product name" className="w-full border border-app rounded-xl px-3 py-2 text-sm bg-transparent" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
            <input placeholder="Category" className="w-full border border-app rounded-xl px-3 py-2 text-sm bg-transparent" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" placeholder="Qty" className="border border-app rounded-xl px-3 py-2 text-sm bg-transparent" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })} />
              <input type="number" min="0" placeholder="Selling Price" className="border border-app rounded-xl px-3 py-2 text-sm bg-transparent" value={newProduct.sellingPrice} onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })} />
            </div>
            <button className="w-full bg-primary-app text-white py-2 rounded-xl font-semibold">Add Product</button>
          </form>
        </Modal>
      )}

      {showSuccess && lastInvoice && (
        <Modal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="Bill Completed"
          maxWidth="32rem"
          closeOnBackdrop
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[color:var(--success)] font-semibold"><Check size={16} /> Bill saved successfully.</div>
            <div className="text-sm text-subtle">Invoice: {lastInvoice.id} | Total: ₹ {lastInvoice.total}</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={shareReceipt} className="inline-flex items-center justify-center gap-1 bg-[color:var(--success)] text-white rounded-xl py-2 font-semibold">
                <MessageCircle size={14} /> WhatsApp
              </button>
              <button onClick={downloadPdf} className="inline-flex items-center justify-center gap-1 bg-primary-app text-white rounded-xl py-2 font-semibold">
                <Download size={14} /> Download PDF
              </button>
            </div>
            <button onClick={() => setShowSuccess(false)} className="w-full border border-app rounded-xl py-2 text-sm">
              <Share2 size={14} className="inline mr-1" /> Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default POS;
