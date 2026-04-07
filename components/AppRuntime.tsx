import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  applyRemoteProfile,
  hydrateConfigData,
  markAuthenticated,
  markSignedOut,
  setLastCloudSyncAt,
} from '../features/configSlice';
import { RootState } from '../store/store';
import {
  getLatestSnapshot,
  getUserProfile,
  observeAuthUser,
  observeUserWorkspace,
  saveUserProfile,
} from '../utils/firebase';
import { hydrateInventory } from '../features/inventorySlice';
import { hydrateRepairs } from '../features/repairSlice';
import { hydratePos } from '../features/posSlice';
import { hydrateBusiness } from '../features/businessSlice';
import { hydrateFinance } from '../features/financeSlice';
import { hydrateCustomers } from '../features/customerSlice';
import { clearStateForEmail, getActiveEmailKey, setActiveEmailKey } from '../store/persistence';
import { TOOL_DEFINITIONS } from '../utils/catalog';
import { ToolFeature } from '../types';
import { deriveRoleFromEmail, isPaidPlan, normalizePlan, UserPlan, UserRole } from '../utils/plans';
import { persistSnapshotByPlan } from '../utils/dataAccess';
import { ensureUserAccountDocument, observeUserPlanChanges, StorageMode } from '../utils/planEngine';

const AppRuntime = () => {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => s);
  const syncTimer = useRef<number | null>(null);
  const adminWriteTimer = useRef<number | null>(null);
  const lastUserSyncHash = useRef('');
  const lastAdminWriteHash = useRef('');
  const storageModeRef = useRef<StorageMode>('temporary');

  useEffect(() => {
    const unsub = observeAuthUser(async (user) => {
      try {
        if (!user) {
          dispatch(markSignedOut());
          setActiveEmailKey(null);
          return;
        }

        const email = user.email?.toLowerCase() || null;
        const emailRole = deriveRoleFromEmail(email);
        const activeEmail = getActiveEmailKey();
        if (email && activeEmail !== email) {
          setActiveEmailKey(email);
          window.location.reload();
          return;
        }

        dispatch(
          markAuthenticated({
            uid: user.uid,
            method: user.providerData?.some((p) => p.providerId === 'password') ? 'email' : 'google',
            email: user.email,
            displayName: user.displayName,
            role: emailRole,
            isAdmin: emailRole === 'admin',
          }),
        );

        const account = await ensureUserAccountDocument({
          uid: user.uid,
          role: emailRole,
          plan: emailRole === 'admin' ? 'business' : 'free',
        });

        if (emailRole === 'admin') {
          await clearStateForEmail(email);
        }

        const profile = await getUserProfile(user.uid);
        if (!profile) {
          dispatch(
            hydrateConfigData({
              role: emailRole,
              plan: emailRole === 'admin' ? 'business' : 'free',
              onboardingCompleted: emailRole === 'admin',
              selectedProfessionId: emailRole === 'admin' ? 'admin' : null,
              customTools: emailRole === 'admin'
                ? TOOL_DEFINITIONS.map((item) => item.id as ToolFeature)
                : [],
            }),
          );
          return;
        }

        const role: UserRole = profile.role === 'admin' || emailRole === 'admin' ? 'admin' : 'user';
        const profilePlan: UserPlan = role === 'admin'
          ? normalizePlan(profile.plan || account?.plan || 'business')
          : (profile.planApprovedByAdmin && isPaidPlan(profile.plan) ? normalizePlan(profile.plan) : 'free');
        const plan: UserPlan = normalizePlan(account?.plan || profilePlan);
        const onboardingCompleted = role === 'admin'
          ? true
          : Boolean(profile.onboardingCompleted || (
            profile.shopName && profile.ownerName && profile.selectedProfessionId && profile.phoneNumber
          ));

        dispatch(
          applyRemoteProfile({
            shopName: profile.shopName || null,
            ownerName: profile.ownerName || null,
            phoneNumber: profile.phoneNumber || null,
            selectedProfessionId: role === 'admin' ? 'admin' : (profile.selectedProfessionId || null),
            plan,
            role,
          }),
        );

        dispatch(
          hydrateConfigData({
            role,
            plan,
            onboardingCompleted,
            selectedProfessionId: role === 'admin' ? 'admin' : (profile.selectedProfessionId || null),
            phoneNumber: profile.phoneNumber || '',
            customTools: role === 'admin'
              ? TOOL_DEFINITIONS.map((item) => item.id as ToolFeature)
              : undefined,
          }),
        );

        if (!isPaidPlan(plan) && role !== 'admin') return;

        const latest = await getLatestSnapshot(user.uid);
        const data = latest?.data as RootState | undefined;
        if (!data) return;

        dispatch(hydrateInventory(data.inventory || { items: [] }));
        dispatch(hydrateRepairs(data.repairs || { tickets: [] }));
        dispatch(hydratePos(data.pos || { invoices: [] }));
        dispatch(hydrateBusiness(data.business || {
          ledger: [],
          appointments: [],
          kitchenOrders: [],
          supplierOrders: [],
          healthRecords: [],
          staffShifts: [],
          warrantyLogs: [],
          serviceBookings: [],
          serviceExpenses: [],
          expiryReturns: [],
        }));
        dispatch(hydrateFinance(data.finance || { transactions: [] }));
        dispatch(hydrateCustomers(data.customers || { list: [] }));
        dispatch(
          hydrateConfigData({
            tasks: data.config?.tasks || [],
            themeMode: data.config?.themeMode || 'light',
            themePalette: data.config?.themePalette || 'Corporate Blue (Default)',
          }),
        );
      } catch {
        // Keep runtime resilient to bootstrap errors.
      }
    });

    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const { config } = state;
    if (!config.isAuthenticated || !config.authUid) return;
    const unsub = observeUserPlanChanges(config.authUid, ({ role, plan, storageMode }) => {
      storageModeRef.current = role === 'admin' ? 'persistent' : storageMode;
      dispatch(
        hydrateConfigData({
          role,
          plan,
        }),
      );
    });
    return () => unsub();
  }, [dispatch, state.config.isAuthenticated, state.config.authUid]);

  useEffect(() => {
    const { config } = state;
    if (!config.isAuthenticated || !config.authUid) return;
    if (!config.isAdmin && !config.onboardingCompleted) return;

    saveUserProfile(config.authUid, {
      email: config.authEmail,
      displayName: config.authDisplayName,
      ownerName: config.ownerName,
      shopName: config.shopName,
      phoneNumber: config.phoneNumber,
      selectedProfessionId: config.selectedProfessionId,
      plan: normalizePlan(config.plan),
      role: config.isAdmin ? 'admin' : config.role,
      onboardingCompleted: config.onboardingCompleted,
    }).catch(() => {
      // no-op
    });
  }, [
    state.config.isAuthenticated,
    state.config.authUid,
    state.config.authEmail,
    state.config.authDisplayName,
    state.config.ownerName,
    state.config.shopName,
    state.config.phoneNumber,
    state.config.selectedProfessionId,
    state.config.plan,
    state.config.onboardingCompleted,
    state.config.role,
    state.config.isAdmin,
  ]);

  useEffect(() => {
    const { config } = state;
    if (!config.isAuthenticated || !config.authUid || !config.isAdmin) return;

    const unsub = observeUserWorkspace(config.authUid, (docs) => {
      const dashboardData = docs.dashboard || {};
      const inventoryData = docs.inventory || {};
      const tasksData = docs.tasks || {};

      dispatch(hydrateInventory(inventoryData.state || dashboardData.inventory || { items: [] }));
      dispatch(hydrateRepairs(dashboardData.repairs || { tickets: [] }));
      dispatch(hydratePos(dashboardData.pos || { invoices: [] }));
      dispatch(hydrateBusiness(dashboardData.business || {
        ledger: [],
        appointments: [],
        kitchenOrders: [],
        supplierOrders: [],
        healthRecords: [],
        staffShifts: [],
        warrantyLogs: [],
        serviceBookings: [],
        serviceExpenses: [],
        expiryReturns: [],
      }));
      dispatch(hydrateFinance(dashboardData.finance || { transactions: [] }));
      dispatch(hydrateCustomers(dashboardData.customers || { list: [] }));
      dispatch(
        hydrateConfigData({
          tasks: tasksData.list || dashboardData.config?.tasks || [],
          themeMode: dashboardData.config?.themeMode || 'light',
          themePalette: dashboardData.config?.themePalette || 'Corporate Blue (Default)',
        }),
      );
    });

    return () => unsub();
  }, [dispatch, state.config.isAuthenticated, state.config.authUid, state.config.isAdmin]);

  useEffect(() => {
    const { config } = state;
    if (!config.isAuthenticated || !config.authUid || config.isAdmin) return;
    if (!config.onboardingCompleted || !isPaidPlan(config.plan)) return;

    const syncPayload = {
      config: {
        shopName: state.config.shopName,
        ownerName: state.config.ownerName,
        phoneNumber: state.config.phoneNumber,
        authEmail: state.config.authEmail,
        selectedProfessionId: state.config.selectedProfessionId,
        onboardingCompleted: state.config.onboardingCompleted,
        customTools: state.config.customTools,
        plan: normalizePlan(state.config.plan),
        tasks: state.config.tasks,
        themeMode: state.config.themeMode,
        themePalette: state.config.themePalette,
      },
      inventory: state.inventory,
      repairs: state.repairs,
      pos: state.pos,
      business: state.business,
      finance: state.finance,
      customers: state.customers,
    };

    const payloadHash = JSON.stringify(syncPayload);
    if (payloadHash === lastUserSyncHash.current) return;
    lastUserSyncHash.current = payloadHash;

    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(async () => {
      try {
        await persistSnapshotByPlan({
          uid: config.authUid as string,
          snapshot: syncPayload,
          storageMode: storageModeRef.current,
          isAdmin: false,
        });
        dispatch(setLastCloudSyncAt(new Date().toISOString()));
      } catch {
        // no-op
      }
    }, 850);

    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [state, dispatch]);

  useEffect(() => {
    const { config } = state;
    if (!config.isAuthenticated || !config.authUid || !config.isAdmin) return;

    const payload = {
      config: {
        shopName: state.config.shopName,
        ownerName: state.config.ownerName,
        phoneNumber: state.config.phoneNumber,
        authEmail: state.config.authEmail,
        selectedProfessionId: 'admin',
        onboardingCompleted: true,
        customTools: state.config.customTools,
        plan: normalizePlan(state.config.plan),
        tasks: state.config.tasks,
        themeMode: state.config.themeMode,
        themePalette: state.config.themePalette,
      },
      inventory: state.inventory,
      repairs: state.repairs,
      pos: state.pos,
      business: state.business,
      finance: state.finance,
      customers: state.customers,
    };

    const payloadHash = JSON.stringify(payload);
    if (payloadHash === lastAdminWriteHash.current) return;
    lastAdminWriteHash.current = payloadHash;

    if (adminWriteTimer.current) window.clearTimeout(adminWriteTimer.current);
    adminWriteTimer.current = window.setTimeout(async () => {
      try {
        await persistSnapshotByPlan({
          uid: config.authUid as string,
          snapshot: payload,
          storageMode: storageModeRef.current,
          isAdmin: true,
        });
        dispatch(setLastCloudSyncAt(new Date().toISOString()));
      } catch {
        // no-op
      }
    }, 450);

    return () => {
      if (adminWriteTimer.current) window.clearTimeout(adminWriteTimer.current);
    };
  }, [state, dispatch]);

  return null;
};

export default AppRuntime;
