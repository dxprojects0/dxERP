
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import inventoryReducer from '../features/inventorySlice';
import repairReducer from '../features/repairSlice';
import configReducer from '../features/configSlice';
import posReducer from '../features/posSlice';
import businessReducer from '../features/businessSlice';
import financeReducer from '../features/financeSlice';
import customerReducer from '../features/customerSlice';
import { saveState } from './persistence';
import { emitToast } from '../utils/toast';

export const rootReducer = combineReducers({
  inventory: inventoryReducer,
  repairs: repairReducer,
  config: configReducer,
  pos: posReducer,
  business: businessReducer,
  finance: financeReducer,
  customers: customerReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createAppStore = (preloadedState?: Partial<RootState>) => {
  const defaultState = rootReducer(undefined, { type: '@@INIT' });
  const mergedPreloadedState = preloadedState
    ? {
        ...defaultState,
        ...preloadedState,
        config: {
          ...defaultState.config,
          ...preloadedState.config,
          isAuthenticated: false,
          authResolved: false,
          authUid: null,
          authEmail: null,
          authDisplayName: null,
          authMethod: null,
          role: 'user',
          isAdmin: false,
        },
      }
    : undefined;

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: mergedPreloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat((_) => (next) => (action: any) => {
        const result = next(action);
        const type = action?.type as string;
        if (!type || type.startsWith('@@')) return result;

        const allowedSlices = ['inventory/', 'repairs/', 'config/', 'pos/', 'business/', 'finance/', 'customers/'];
        if (!allowedSlices.some((prefix) => type.startsWith(prefix))) return result;

        const excluded = [
          'markAuthenticated',
          'markSignedOut',
          'applyRemoteProfile',
          'setLastCloudSyncAt',
          'hydrate',
        ];
        if (excluded.some((word) => type.includes(word))) return result;

        const simple = type.split('/')[1] || 'updated';
        const message = simple
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (c) => c.toUpperCase())
          .trim();
        emitToast({ variant: 'success', message: `${message} successfully.` });
        return result;
      }),
  });

  store.subscribe(() => {
    const state = store.getState();
    if (!state.config.isAuthenticated) return;
    if (state.config.isAdmin) return;
    saveState(state);
  });

  return store;
};

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
