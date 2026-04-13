import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Clock3, Home, ListChecks, LogOut, Menu, Moon, Plus, ReceiptText, Sun, UserCircle2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { markLoginPromptShownToday, signOutUser, setOwnerName, setPhoneNumber, setShopName } from '../features/configSlice';
import { getPaletteByName } from '../utils/themes';
import { saveUserProfile, signOutFirebase, trackPageView } from '../utils/firebase';
import { PRESET_TOOLS, TOOL_DEFINITIONS } from '../utils/catalog';
import { buildUserToolRoute, ROUTES } from '../utils/routes';
import ToastHost from './ToastHost';
import Modal from './Modal';
import { emitToast } from '../utils/toast';
import { ToolFeature } from '../types';
import { isPaidPlan } from '../utils/plans';
import { clearAllIndexedDbState } from '../store/persistence';
import { handlePlanAwareLogout } from '../utils/dataAccess';
import { getPublicTheme, setPublicTheme } from '../utils/publicTheme';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [time, setTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [promptShop, setPromptShop] = useState('');
  const [promptOwner, setPromptOwner] = useState('');
  const [promptPhone, setPromptPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [publicThemeMode, setPublicThemeMode] = useState<'light' | 'dark'>(() => getPublicTheme());
  const location = useLocation();
  const [pageAnim, setPageAnim] = useState(false);

  const {
    isAuthenticated,
    onboardingCompleted,
    isAdmin,
    shopName,
    ownerName,
    phoneNumber,
    themeMode,
    themePalette,
    selectedProfessionId,
    customTools,
    plan,
    firstUseAt,
    lastLoginPromptDate,
  } = useSelector((state: RootState) => state.config);
  const appState = useSelector((state: RootState) => state);
  const isAppReady = isAuthenticated && (onboardingCompleted || isAdmin);
  const isPublicThemeRoute = location.pathname === ROUTES.home
    || location.pathname === ROUTES.setup
    || location.pathname === ROUTES.admin;
  const isPublicNavRoute = location.pathname === ROUTES.home || location.pathname === ROUTES.setup;
  const showTopHeader = isAppReady || isPublicNavRoute;

  const palette = useMemo(() => getPaletteByName(themePalette), [themePalette]);
  const selectedTools = useMemo(() => {
    if (isAdmin) {
      return customTools.length
        ? customTools
        : TOOL_DEFINITIONS.map((item) => item.id as ToolFeature);
    }
    const preset = selectedProfessionId ? PRESET_TOOLS[selectedProfessionId] || [] : [];
    const allowedCustom = isPaidPlan(plan) ? customTools : [];
    return Array.from(new Set([...(preset as ToolFeature[]), ...(allowedCustom as ToolFeature[])]));
  }, [selectedProfessionId, customTools, plan, isAdmin]);
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // small entry animation on route change
    setPageAnim(true);
    const t = setTimeout(() => setPageAnim(false), 20);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    trackPageView(location.pathname).catch(() => {
      // no-op
    });
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (isPublicThemeRoute) {
      const isDark = publicThemeMode === 'dark';
      root.style.setProperty('--background', isDark ? '#0b1425' : '#f3f8ff');
      root.style.setProperty('--surface', isDark ? '#0f1d33' : '#ffffff');
      root.style.setProperty('--primary', '#1e90ff');
      root.style.setProperty('--text-primary', isDark ? '#e6f1ff' : '#0f2d66');
      root.style.setProperty('--text-secondary', isDark ? '#a7bfdc' : '#385173');
      root.style.setProperty('--border', isDark ? '#233a5a' : '#d4e7ff');
      root.style.setProperty('--success', '#16a34a');
      root.style.setProperty('--warning', '#f59e0b');
      root.style.setProperty('--danger', '#dc2626');
      root.style.setProperty('color-scheme', isDark ? 'dark' : 'dark');
      return;
    }
    const theme = themeMode === 'dark' ? palette.darkTheme : palette.lightTheme;
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--success', theme.success);
    root.style.setProperty('--warning', theme.warning);
    root.style.setProperty('--danger', theme.danger);
    root.style.setProperty('color-scheme', themeMode === 'dark' ? 'dark' : 'dark');
  }, [palette, themeMode, isPublicThemeRoute, publicThemeMode]);

  useEffect(() => {
    if (!isAppReady || isAdmin || isPaidPlan(plan) || !firstUseAt) return;
    const startedAt = new Date(firstUseAt).getTime();
    if (Number.isNaN(startedAt)) return;
    const now = Date.now();
    const afterThreeDays = now - startedAt >= 3 * 24 * 60 * 60 * 1000;
    if (!afterThreeDays) return;
    const lastPromptAt = lastLoginPromptDate ? new Date(lastLoginPromptDate).getTime() : 0;
    const needsPrompt = !lastPromptAt || now - lastPromptAt >= 24 * 60 * 60 * 1000;
    if (needsPrompt) setShowUpgradePrompt(true);
  }, [isAppReady, isAdmin, plan, firstUseAt, lastLoginPromptDate]);

  useEffect(() => {
    if (!isAppReady || isAdmin) return;
    const missing = !shopName || !ownerName || !phoneNumber;
    if (missing) {
      setPromptShop(shopName || '');
      setPromptOwner(ownerName || '');
      setPromptPhone(phoneNumber || '');
      setShowProfilePrompt(true);
    }
  }, [isAppReady, isAdmin, shopName, ownerName, phoneNumber]);

  const saveProfilePrompt = async () => {
    if (!appState.config.authUid) return;
    if (!promptOwner.trim() || !promptShop.trim()) {
      emitToast({ variant: 'error', message: 'Please add owner and business name.' });
      return;
    }
    setSavingProfile(true);
    try {
      await saveUserProfile(appState.config.authUid, {
        email: appState.config.authEmail,
        displayName: appState.config.authDisplayName,
        shopName: promptShop.trim(),
        ownerName: promptOwner.trim(),
        phoneNumber: promptPhone.trim(),
        selectedProfessionId: selectedProfessionId || 'general',
        plan,
        role: appState.config.isAdmin ? 'admin' : 'user',
      });
      dispatch(setShopName(promptShop.trim()));
      dispatch(setOwnerName(promptOwner.trim()));
      dispatch(setPhoneNumber(promptPhone.trim()));
      setShowProfilePrompt(false);
      emitToast({ variant: 'success', message: 'Profile saved.' });
    } catch (err: any) {
      const msg = err?.message || 'Could not save profile. Check your connection.';
      emitToast({ variant: 'error', message: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const closeUpgradePrompt = () => {
    dispatch(markLoginPromptShownToday(new Date().toISOString()));
    setShowUpgradePrompt(false);
  };

  const isRouteActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-app text-app">
      <ToastHost />
      {isAppReady && (
        <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 border-r border-app bg-surface z-40 flex-col">
          <button
            onClick={() => navigate(ROUTES.userDashboard)}
            className="h-20 border-b border-app text-left px-6"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-subtle py-1">
  Dashboard
</p>

<div className="flex items-center gap-2">
  <img
    src="/favicon.png"
    alt="DhandaX"
    className="h-6 w-6 rounded-md"
  />

  <h1 className="text-2xl font-black text-subtle">
    DhandaX
  </h1>
</div>
    
     </button>
          <nav className="p-4 space-y-2">
            <NavLink to={ROUTES.userDashboard} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${isActive ? 'bg-primary-app text-white' : 'hover:bg-black/5'}`}>
              <Home size={17} /> Home
            </NavLink>
            <NavLink to={ROUTES.userBills} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${isActive ? 'bg-primary-app text-white' : 'hover:bg-black/5'}`}>
              <ReceiptText size={17} /> Bills
            </NavLink>
            <NavLink to={ROUTES.userAnalytics} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${isActive ? 'bg-primary-app text-white' : 'hover:bg-black/5'}`}>
              <BarChart3 size={17} /> Analytics
            </NavLink>
            <NavLink to={ROUTES.userTasks} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${isActive ? 'bg-primary-app text-white' : 'hover:bg-black/5'}`}>
              <ListChecks size={17} /> Tasks
            </NavLink>
            <NavLink to={ROUTES.userProfile} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${isActive ? 'bg-primary-app text-white' : 'hover:bg-black/5'}`}>
              <UserCircle2 size={17} /> Profile
            </NavLink>
          </nav>
          <div className="mt-auto p-4 border-t border-app text-xs text-subtle flex items-center gap-2">
            <Clock3 size={13} />
            {time.toLocaleTimeString()}
          </div>
        </aside>
      )}

      <div className={isAppReady ? 'md:ml-64 min-h-screen flex flex-col' : 'min-h-screen flex flex-col'}>
        <header
          className={`h-14 px-4 md:px-6 items-center justify-between sticky top-0 z-30 ${showTopHeader ? 'flex' : 'hidden'} ${(isPublicNavRoute && !isAppReady) ? '' : 'bg-surface border-b border-app'}`}
          style={(isPublicNavRoute && !isAppReady) ? { background: 'transparent', border: 'none', boxShadow: 'none', color: '#e5edff' } : {}}
        >
          <div className="flex items-center gap-3">
            {isAppReady && (
              <button onClick={() => setShowMenu(true)} className="md:hidden p-2 rounded-lg border border-app">
                <Menu size={16} />
              </button>
            )}
            {isPublicNavRoute && !isAppReady ? (
              <div className="flex items-center gap-2">
                <img src="/favicon.png" alt="DhandaX" className="h-7 w-7 rounded-lg shadow-sm" />
                <h2 className="text-xl font-black text-white md:text-slate-100">DhandaX</h2>
              </div>
            ) : null}
          </div>
          {isAppReady && <div />}
          {/* {!isAppReady && isPublicNavRoute && (
            <button
              onClick={() => {
                const next = publicThemeMode === 'dark' ? 'dark' : 'dark';
                setPublicThemeMode(next);
                setPublicTheme(next);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-app text-xs font-semibold"
              title="Toggle Light/Dark"
            >
              {publicThemeMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {publicThemeMode === 'dark' ? 'dark' : 'Dark'}
            </button>
          )} */}
        </header>

        <main className={`flex-1 p-4 md:p-8 custom-scrollbar overflow-y-auto overflow-x-hidden ${isAppReady ? 'pb-24 md:pb-8' : ''}`}>
          <div className="page-wrapper" style={{ transform: pageAnim ? 'translateY(8px) scale(.998)' : 'none', opacity: pageAnim ? 0.96 : 1 }}>
            <Outlet />
          </div>
        </main>

        {isAppReady && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-app z-40 pb-[env(safe-area-inset-bottom)]">
            <div className="grid grid-cols-5 items-center">
              <button onClick={() => navigate(ROUTES.userDashboard)} className={`py-2 text-[11px] flex flex-col items-center gap-1 ${isRouteActive(ROUTES.userDashboard) ? 'text-primary-app' : ''}`}>
                <Home size={16} /> Home
              </button>
              <button onClick={() => navigate(ROUTES.userBills)} className={`py-2 text-[11px] flex flex-col items-center gap-1 ${isRouteActive(ROUTES.userBills) ? 'text-primary-app' : ''}`}>
                <ReceiptText size={16} /> Bills
              </button>
              <div className="flex flex-col items-center justify-center">
                <button
                  onClick={() => setShowToolMenu(true)}
                  className="h-12 w-12 -mt-5 rounded-full bg-primary-app text-white border-4 border-surface flex items-center justify-center shadow-lg"
                  title="Menu"
                >
                  <span className={`plus-rot ${showToolMenu ? 'open' : ''}`}>
                    <Plus size={18} />
                  </span>
                </button>
                <span className="text-[11px] mt-0.5">Menu</span>
              </div>
              <button onClick={() => navigate(ROUTES.userAnalytics)} className={`py-2 text-[11px] flex flex-col items-center gap-1 ${isRouteActive(ROUTES.userAnalytics) ? 'text-primary-app' : ''}`}>
                <BarChart3 size={16} /> Analytics
              </button>
              <button onClick={() => navigate(ROUTES.userProfile)} className={`py-2 text-[11px] flex flex-col items-center gap-1 ${isRouteActive(ROUTES.userProfile) ? 'text-primary-app' : ''}`}>
                <UserCircle2 size={16} /> Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {showMenu && isAppReady && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50">
          <div className="bg-surface h-full w-[82%] max-w-xs border-r border-app p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Menu</h3>
              <button onClick={() => setShowMenu(false)}><X size={16} /></button>
            </div>
            <div className="text-xs text-subtle border border-app rounded-lg px-3 py-2 mb-3 inline-flex items-center gap-2">
              <Clock3 size={13} />
              {time.toLocaleTimeString()}
            </div>
            <div className="space-y-2">
              <button onClick={() => { navigate(ROUTES.userDashboard); setShowMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg border border-app">Home</button>
              <button onClick={() => { navigate(ROUTES.userBills); setShowMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg border border-app">Bills</button>
              <button onClick={() => { navigate(ROUTES.userAnalytics); setShowMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg border border-app">Analytics</button>
              <button onClick={() => { navigate(ROUTES.userTasks); setShowMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg border border-app">Tasks</button>
              <button onClick={() => { navigate(ROUTES.userProfile); setShowMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg border border-app">Profile</button>
              <button
                onClick={async () => {
                  try {
                    if (appState.config.authUid) {
                      const storageMode = appState.config.isAdmin
                        ? 'persistent'
                        : (isPaidPlan(appState.config.plan) ? 'hybrid' : 'temporary');
                      await handlePlanAwareLogout({
                        uid: appState.config.authUid,
                        storageMode,
                        snapshot: {
                          config: appState.config,
                          inventory: appState.inventory,
                          repairs: appState.repairs,
                          pos: appState.pos,
                          business: appState.business,
                          finance: appState.finance,
                          customers: appState.customers,
                        },
                        isAdmin: appState.config.isAdmin,
                      });
                    } else {
                      await clearAllIndexedDbState();
                    }
                    await signOutFirebase();
                  } catch {
                    emitToast({ variant: 'error', message: 'Logout failed. Try again.' });
                    return;
                  }
                  dispatch(signOutUser());
                  setShowMenu(false);
                  navigate(ROUTES.home);
                  emitToast({ variant: 'success', message: 'Logged out. Local data cleared.' });
                }}
                className="w-full text-left px-3 py-2 rounded-lg border border-[var(--danger)] text-white bg-[color:var(--danger)]/85 flex items-center gap-2"
              >
                <LogOut size={14} /> Logout & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {showToolMenu && isAppReady && (
        <div className="md:hidden fixed inset-0 z-[80] bg-black/45" onClick={() => setShowToolMenu(false)}>
          <div
            className="absolute bottom-16 left-2 right-2 rounded-2xl border border-app bg-surface p-3 shadow-2xl max-h-[62vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-sm">Open Apps</h3>
              <button onClick={() => setShowToolMenu(false)} className="p-1 border border-app rounded-lg"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selectedTools.map((tool) => {
                const def = TOOL_DEFINITIONS.find((item) => item.id === tool);
                return (
                  <button
                    key={tool}
                    onClick={() => {
                      navigate(buildUserToolRoute(tool));
                      setShowToolMenu(false);
                    }}
                    className="min-h-[72px] text-left rounded-xl border border-app px-3 py-2"
                  >
                    <p className="text-[10px] text-subtle uppercase tracking-wide">{def?.category || 'Tool'}</p>
                    <p className="text-sm font-semibold mt-1 leading-tight">{def?.label || tool}</p>
                  </button>
                );
              })}
              {selectedTools.length === 0 && <p className="text-xs text-subtle">No tools selected.</p>}
            </div>
          </div>
        </div>
      )}

      {showUpgradePrompt && isAppReady && (
        <div className="fixed inset-0 z-[90] bg-black/45 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-surface border border-app rounded-2xl p-5 space-y-3">
            <h3 className="text-xl font-black">Upgrade Reminder</h3>
            <p className="text-sm text-subtle">
              Protect your business data with cloud backup, monthly trends, and multi-device continuity. Upgrade to unlock full benefits.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  closeUpgradePrompt();
                  navigate(ROUTES.userProfile);
                }}
                className="px-3 py-2 rounded-xl bg-primary-app text-white font-semibold text-sm"
              >
                View Plans
              </button>
              <button
                onClick={closeUpgradePrompt}
                className="px-3 py-2 rounded-xl border border-app font-semibold text-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfilePrompt && isAppReady && (
        <Modal
          isOpen={showProfilePrompt}
          onClose={() => {}}
          title="Complete your profile"
          maxWidth="26rem"
          closeOnBackdrop={false}
        >
          <div className="space-y-3">
            <p className="text-sm text-subtle">Add basic details so we can personalize tools and invoices.</p>
            <input
              value={promptOwner}
              onChange={(e) => setPromptOwner(e.target.value)}
              placeholder="Owner name"
              className="w-full border border-app rounded-lg px-3 py-2 bg-transparent"
            />
            <input
              value={promptShop}
              onChange={(e) => setPromptShop(e.target.value)}
              placeholder="Business name"
              className="w-full border border-app rounded-lg px-3 py-2 bg-transparent"
            />
            <input
              value={promptPhone}
              maxLength={10}
              inputMode="numeric"
              onChange={(e) => setPromptPhone(e.target.value.replace(/\\D/g, '').slice(0, 10))}
              placeholder="Phone number"
              className="w-full border border-app rounded-lg px-3 py-2 bg-transparent"
            />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={saveProfilePrompt}
                disabled={savingProfile || !(promptOwner.trim() && promptShop.trim())}
                className="px-3 py-2 rounded-lg bg-primary-app text-white font-semibold disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save & Continue'}
              </button>
              <button
                onClick={() => setShowProfilePrompt(false)}
                className="px-3 py-2 rounded-lg border border-app font-semibold"
              >
                Later
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Layout;
