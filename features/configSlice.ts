import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConfigState, ToolFeature } from '../types';
import { UserPlan, UserRole } from '../utils/plans';

const initialState: ConfigState = {
  shopName: '',
  ownerName: '',
  phoneNumber: '',
  hasSeenPrompt: false,
  selectedProfessionId: null,
  onboardingCompleted: false,
  authResolved: false,
  customTools: [],
  firstUseAt: null,
  lastLoginPromptDate: null,
  isAuthenticated: false,
  authUid: null,
  authEmail: null,
  authDisplayName: null,
  authMethod: null,
  role: 'user',
  isAdmin: false,
  plan: 'free',
  proStartedAt: null,
  lastCloudSyncAt: null,
  tasks: [],
  themeMode: 'light',
  themePalette: 'Corporate Blue (Default)',
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setShopName: (state, action: PayloadAction<string>) => {
      state.shopName = action.payload;
      state.hasSeenPrompt = true;
      if (!state.firstUseAt) state.firstUseAt = new Date().toISOString();
    },
    setOwnerName: (state, action: PayloadAction<string>) => {
      state.ownerName = action.payload;
      state.hasSeenPrompt = true;
      if (!state.firstUseAt) state.firstUseAt = new Date().toISOString();
    },
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    setProfession: (state, action: PayloadAction<string>) => {
      if (!state.selectedProfessionId) {
        state.selectedProfessionId = action.payload;
      }
    },
    toggleCustomTool: (state, action: PayloadAction<ToolFeature>) => {
      const exists = state.customTools.includes(action.payload);
      if (exists) {
        state.customTools = state.customTools.filter(t => t !== action.payload);
      } else {
        state.customTools.push(action.payload);
      }
    },
    setCustomTools: (state, action: PayloadAction<ToolFeature[]>) => {
      state.customTools = action.payload;
    },
    markLoginPromptShownToday: (state, action: PayloadAction<string>) => {
      state.lastLoginPromptDate = action.payload;
    },
    markAuthenticated: (
      state,
      action: PayloadAction<{
        uid: string;
        method: 'google' | 'phone' | 'email';
        email?: string | null;
        displayName?: string | null;
        role?: UserRole;
        isAdmin?: boolean;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.authResolved = true;
      state.authUid = action.payload.uid;
      state.authMethod = action.payload.method;
      state.authEmail = action.payload.email || null;
      state.authDisplayName = action.payload.displayName || null;
      state.role = action.payload.role || (action.payload.isAdmin ? 'admin' : 'user');
      state.isAdmin = state.role === 'admin';
    },
    markSignedOut: (state) => {
      state.isAuthenticated = false;
      state.authResolved = true;
      state.authUid = null;
      state.authEmail = null;
      state.authDisplayName = null;
      state.authMethod = null;
      state.role = 'user';
      state.isAdmin = false;
    },
    setAdminAccess: (state, action: PayloadAction<boolean>) => {
      state.isAdmin = action.payload;
      state.role = action.payload ? 'admin' : 'user';
    },
    applyRemoteProfile: (
      state,
      action: PayloadAction<{
        shopName?: string | null;
        ownerName?: string | null;
        phoneNumber?: string | null;
        selectedProfessionId?: string | null;
        plan?: UserPlan;
        role?: UserRole;
      }>,
    ) => {
      if (action.payload.shopName) state.shopName = action.payload.shopName;
      if (action.payload.ownerName) state.ownerName = action.payload.ownerName;
      if (action.payload.phoneNumber !== undefined && action.payload.phoneNumber !== null) state.phoneNumber = action.payload.phoneNumber;
      if (action.payload.selectedProfessionId) state.selectedProfessionId = action.payload.selectedProfessionId;
      if (action.payload.role) {
        state.role = action.payload.role;
        state.isAdmin = action.payload.role === 'admin';
      }
      if (action.payload.plan) state.plan = action.payload.plan;
      if (state.shopName && state.ownerName && state.selectedProfessionId && state.phoneNumber) {
        state.onboardingCompleted = true;
      }
    },
    hydrateConfigData: (
      state,
      action: PayloadAction<{
        shopName?: string;
        ownerName?: string;
        phoneNumber?: string;
        selectedProfessionId?: string | null;
        onboardingCompleted?: boolean;
        authResolved?: boolean;
        customTools?: ToolFeature[];
        plan?: UserPlan;
        role?: UserRole;
        tasks?: { id: string; title: string; done: boolean; createdAt: string }[];
        themeMode?: 'light' | 'dark';
        themePalette?: string;
      }>,
    ) => {
      const payload = action.payload;
      if (payload.shopName !== undefined) state.shopName = payload.shopName;
      if (payload.ownerName !== undefined) state.ownerName = payload.ownerName;
      if (payload.phoneNumber !== undefined) state.phoneNumber = payload.phoneNumber;
      if (payload.selectedProfessionId !== undefined) state.selectedProfessionId = payload.selectedProfessionId;
      if (payload.onboardingCompleted !== undefined) state.onboardingCompleted = payload.onboardingCompleted;
      if (payload.authResolved !== undefined) state.authResolved = payload.authResolved;
      if (payload.customTools) state.customTools = payload.customTools;
      if (payload.plan) state.plan = payload.plan;
      if (payload.role) {
        state.role = payload.role;
        state.isAdmin = payload.role === 'admin';
      }
      if (payload.tasks) state.tasks = payload.tasks;
      if (payload.themeMode) state.themeMode = payload.themeMode;
      if (payload.themePalette) state.themePalette = payload.themePalette;
    },
    signOutUser: (state) => {
      state.isAuthenticated = false;
      state.authResolved = true;
      state.authUid = null;
      state.authEmail = null;
      state.authDisplayName = null;
      state.authMethod = null;
      state.role = 'user';
      state.isAdmin = false;
    },
    completeOnboarding: (state) => {
      state.onboardingCompleted = true;
      state.hasSeenPrompt = true;
      if (!state.firstUseAt) state.firstUseAt = new Date().toISOString();
    },
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.themeMode = action.payload;
    },
    setThemePalette: (state, action: PayloadAction<string>) => {
      state.themePalette = action.payload;
    },
    setPlan: (state, action: PayloadAction<UserPlan>) => {
      state.plan = action.payload;
      if ((action.payload === 'pro' || action.payload === 'business') && !state.proStartedAt) {
        state.proStartedAt = new Date().toISOString();
      }
    },
    setLastCloudSyncAt: (state, action: PayloadAction<string>) => {
      state.lastCloudSyncAt = action.payload;
    },
    addTask: (state, action: PayloadAction<string>) => {
      const title = action.payload.trim();
      if (!title) return;
      state.tasks.push({
        id: `task-${Date.now()}`,
        title,
        done: false,
        createdAt: new Date().toISOString(),
      });
    },
    toggleTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) task.done = !task.done;
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    }
  },
});

export const {
  setShopName,
  setOwnerName,
  setPhoneNumber,
  setProfession,
  toggleCustomTool,
  setCustomTools,
  markLoginPromptShownToday,
  markAuthenticated,
  markSignedOut,
  setAdminAccess,
  applyRemoteProfile,
  hydrateConfigData,
  signOutUser,
  completeOnboarding,
  setThemeMode,
  setThemePalette,
  setPlan,
  setLastCloudSyncAt,
  addTask,
  toggleTask,
  deleteTask,
} = configSlice.actions;
export default configSlice.reducer;
