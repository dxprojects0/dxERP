import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  BarChart3,
  Package,
  BookOpenText,
  Truck,
  CalendarDays,
  HeartPulse,
  CookingPot,
  Users,
  Wrench,
  ShieldCheck,
  ClipboardList,
  ReceiptIndianRupee,
  Plus,
  Settings2,
} from 'lucide-react';
import { RootState } from '../store/store';
import { PRESET_TOOLS, PROFESSIONS, TOOL_DEFINITIONS } from '../utils/catalog';
import { ToolFeature } from '../types';
import { buildUserToolRoute, ROUTES } from '../utils/routes';
import { emitToast } from '../utils/toast';
import { checkFirestoreConnection, syncUserDataToFirestore, toFirebaseSyncMessage } from '../utils/firebase';
import { clearStateForEmail } from '../store/persistence';
import { setLastCloudSyncAt } from '../features/configSlice';
import { isPaidPlan } from '../utils/plans';
import Modal from '../components/Modal';

const toolIconMap: Record<ToolFeature, React.ReactNode> = {
  billing: <ReceiptIndianRupee size={18} />,
  inventory: <Package size={18} />,
  ledger: <BookOpenText size={18} />,
  ordering: <Truck size={18} />,
  reports: <BarChart3 size={18} />,
  expiry: <ShieldCheck size={18} />,
  appointments: <CalendarDays size={18} />,
  ehr: <HeartPulse size={18} />,
  kitchen: <CookingPot size={18} />,
  staff: <Users size={18} />,
  repairTickets: <Wrench size={18} />,
  warranty: <ShieldCheck size={18} />,
  jobBooking: <ClipboardList size={18} />,
  expenses: <CircleDollarSign size={18} />,
};

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showSyncConfirm, setShowSyncConfirm] = React.useState(false);
  const inventoryState = useSelector((state: RootState) => state.inventory);
  const repairState = useSelector((state: RootState) => state.repairs);
  const posState = useSelector((state: RootState) => state.pos);
  const businessState = useSelector((state: RootState) => state.business);
  const financeState = useSelector((state: RootState) => state.finance);
  const customersState = useSelector((state: RootState) => state.customers);
  const configState = useSelector((state: RootState) => state.config);
  const invoices = useSelector((state: RootState) => state.pos.invoices || []);
  const {
    customTools,
    selectedProfessionId,
    ownerName,
    shopName,
    plan,
    isAdmin,
    authUid,
    authEmail,
  } = useSelector((state: RootState) => state.config);

  const professionName = PROFESSIONS.find((p) => p.id === selectedProfessionId)?.name || (isAdmin ? 'Admin' : 'General');
  const baseTools = selectedProfessionId ? (PRESET_TOOLS[selectedProfessionId] || []) : [];
  const finalTools: ToolFeature[] = isAdmin
    ? (customTools.length
      ? customTools
      : TOOL_DEFINITIONS.map((item) => item.id as ToolFeature))
    : Array.from(new Set([...(baseTools as ToolFeature[]), ...((isPaidPlan(plan) ? customTools : []) as ToolFeature[])]));

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const todaySales = invoices.filter((inv) => inv.date.startsWith(today)).reduce((acc, inv) => acc + inv.total, 0);
  const yesterdaySales = invoices.filter((inv) => inv.date.startsWith(yesterday)).reduce((acc, inv) => acc + inv.total, 0);
  const delta = todaySales - yesterdaySales;
  const deltaPercent = yesterdaySales > 0 ? Math.round((delta / yesterdaySales) * 100) : 0;

  const useCountUp = (value: number, from = 0, duration = 700) => {
    const [display, setDisplay] = React.useState(from);
    React.useEffect(() => {
      const start = performance.now();
      const begin = from;
      const tick = (t: number) => {
        const progress = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(begin + (value - begin) * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, [value, from, duration]);
    return display;
  };

  const animatedToday = useCountUp(todaySales, 999, 900);
  const animatedYesterday = useCountUp(yesterdaySales, 999, 900);
  const animatedTools = useCountUp(finalTools.length, 0, 900);

  const syncNow = async () => {
    if (!authUid || !isAdmin) return;
    const syncPayload = {
      config: {
        shopName,
        ownerName,
        selectedProfessionId,
        onboardingCompleted: configState.onboardingCompleted,
        customTools,
        plan,
        tasks: configState.tasks,
        themeMode: configState.themeMode,
        themePalette: configState.themePalette,
      },
      inventory: inventoryState,
      repairs: repairState,
      pos: posState,
      business: businessState,
      finance: financeState,
      customers: customersState,
    };
    try {
      await syncUserDataToFirestore(authUid, syncPayload, true);
      await clearStateForEmail(authEmail);
      dispatch(setLastCloudSyncAt(new Date().toISOString()));
      emitToast({ variant: 'success', message: 'Synced to cloud and cleared phone storage. Reloading...' });
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      emitToast({ variant: 'error', message: toFirebaseSyncMessage(error) });
    }
  };

  const checkConnectionNow = async () => {
    if (!authUid || !isAdmin) return;
    const result = await checkFirestoreConnection(authUid, true);
    emitToast({ variant: result.ok ? 'success' : 'error', message: result.message });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      <section className="rounded-3xl border border-app bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-subtle">{professionName} Dashboard</p>
        <h1 className="text-3xl font-black mt-1">Welcome, {ownerName || 'Business Owner'}</h1>
        <p className="text-lg font-semibold mt-1">{shopName || 'Your Business'}</p>
        <p className="text-sm text-subtle mt-2">
          Category: <span className="font-semibold uppercase">{selectedProfessionId || (isAdmin ? 'ADMIN' : 'NOT SET')}</span>
        </p>
        <div className={`inline-flex items-center gap-1 mt-3 text-sm font-semibold ${delta >= 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
          {delta >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(deltaPercent)}% {delta >= 0 ? 'more than' : 'lower than'} yesterday
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {isAdmin && (
            <button onClick={checkConnectionNow} className="px-4 py-2 rounded-lg border border-app text-sm font-semibold">
              Check Connection
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowSyncConfirm(true)} className="px-4 py-2 rounded-lg bg-primary-app text-white text-sm font-semibold">
              Sync Now (Admin)
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-app bg-surface p-4">
          <p className="text-xs text-subtle">Revenue Today</p>
          <p className="text-2xl font-black mt-1">₹ {animatedToday}</p>
        </div>
        <div className="rounded-2xl border border-app bg-surface p-4">
          <p className="text-xs text-subtle">Yesterday Revenue</p>
          <p className="text-2xl font-black mt-1">₹ {animatedYesterday}</p>
        </div>
        <div className="rounded-2xl border border-app bg-surface p-4">
          <p className="text-xs text-subtle">Active Tools</p>
          <p className="text-2xl font-black mt-1">{animatedTools}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-app bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2 justify-between mb-3">
          <h2 className="font-black">Recent Transactions</h2>
        </div>
        <div className="space-y-2">
          {invoices.slice(-6).reverse().map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-app px-3 py-2">
              <div className="inline-flex items-center gap-2">
                <CircleDollarSign size={15} />
                <span className="text-sm">Invoice #{invoice.id.slice(-4)}</span>
              </div>
              <div className={`text-sm font-bold ${invoice.total >= 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
                {invoice.total >= 0 ? '+' : '-'} ₹ {Math.abs(invoice.total)}
              </div>
            </div>
          ))}
          {invoices.length === 0 && <div className="text-sm text-subtle py-4 text-center">No transactions yet.</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-app bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-black">Apps</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(ROUTES.userTools)}
              className="px-3 py-2 rounded-lg border border-app text-sm inline-flex items-center gap-1"
            >
              <Settings2 size={14} /> Open tools
            </button>
            <button
              onClick={() => {
                if (!isPaidPlan(plan)) {
                  emitToast({ variant: 'info', message: 'Upgrade to Pro to unlock extra tools.' });
                  return;
                }
                navigate(ROUTES.userCustomTools);
              }}
              className="px-3 py-2 rounded-lg bg-primary-app text-white text-sm inline-flex items-center gap-1"
            >
              <Plus size={14} /> Add more tools
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {finalTools.map((tool) => {
            const item = TOOL_DEFINITIONS.find((def) => def.id === tool);
            return (
              <button
                key={tool}
                onClick={() => navigate(buildUserToolRoute(tool))}
                className="rounded-2xl border border-app px-4 py-4 min-h-[130px] text-left bg-app/35 hover:bg-[color:var(--primary)]/8 transition-all"
              >
                <div className="h-8 w-8 rounded-lg bg-[color:var(--primary)]/14 text-primary-app flex items-center justify-center">
                  {toolIconMap[tool]}
                </div>
                <p className="text-xs text-subtle mt-3">{item?.category || 'Tool'}</p>
                <p className="font-semibold text-sm mt-1">{item?.label || tool}</p>
              </button>
            );
          })}
          {finalTools.length === 0 && <p className="text-sm text-subtle">No tools selected yet.</p>}
        </div>
      </section>

      {showSyncConfirm && isAdmin && (
        <Modal
          isOpen={showSyncConfirm}
          onClose={() => setShowSyncConfirm(false)}
          title="Save Data to Cloud"
          maxWidth="24rem"
          closeOnBackdrop={false}
        >
          <div className="space-y-3">
            <h3 className="text-lg font-black">Save Data to Cloud</h3>
            <p className="text-sm text-subtle">Don't lose your data. Save it in cloud now and keep a safe backup.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  setShowSyncConfirm(false);
                  await syncNow();
                }}
                className="px-3 py-2 rounded-xl bg-primary-app text-white text-sm font-semibold"
              >
                Save Now
              </button>
              <button onClick={() => setShowSyncConfirm(false)} className="px-3 py-2 rounded-xl border border-app text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
