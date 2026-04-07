import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import {
  UserCredential,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  signInWithPopup,
} from 'firebase/auth';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { deriveRoleFromEmail, normalizePlan, UserPlan, UserRole } from './plans';

const firebaseConfig = {
  apiKey: 'AIzaSyC2v7H63bKL7Q-Iwob568xS4HQtX2T_C00',
  authDomain: 'dxtoolz.firebaseapp.com',
  projectId: 'dxtoolz',
  storageBucket: 'dxtoolz.firebasestorage.app',
  messagingSenderId: '913198786720',
  appId: '1:913198786720:web:8c0f7ea7f1f1fa6fa681c5',
  measurementId: 'G-K9JRPR9NKM',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const ADMIN_EMAIL = 'admin@dxtoolz.com';
const ADMIN_PASSWORD = 'dx1stdemojs';

const profileRef = (uid: string) => doc(db, 'users', uid, 'profile', 'data');
const dashboardRef = (uid: string) => doc(db, 'users', uid, 'dashboard', 'data');
const inventoryRef = (uid: string) => doc(db, 'users', uid, 'inventory', 'data');
const tasksRef = (uid: string) => doc(db, 'users', uid, 'tasks', 'data');
const legacyUserRef = (uid: string) => doc(db, 'users', uid);
const adminAccountRef = (uid: string) => doc(db, 'adminAccounts', uid);
const adminManagementRef = (docId: string) => doc(db, 'adminManagement', docId);

const sanitizeForFirestore = (value: any): any => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((item) => sanitizeForFirestore(item));
  if (typeof value === 'object') {
    const next: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      const cleaned = sanitizeForFirestore(val);
      if (cleaned !== undefined) next[key] = cleaned;
    });
    return next;
  }
  return value;
};

const toRole = (email?: string | null, role?: UserRole): UserRole => {
  const emailRole = deriveRoleFromEmail(email);
  if (emailRole === 'admin') return 'admin';
  if (role === 'admin') return 'user';
  return role || 'user';
};

const firstNonEmpty = (...values: Array<any>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const normalizeProfilePayload = (uid: string, raw?: Record<string, any> | null) => {
  if (!raw) return null;
  const email = firstNonEmpty(raw.email)?.toLowerCase() || null;
  const ownerName = firstNonEmpty(raw.ownerName, raw.name, raw.contactName);
  const shopName = firstNonEmpty(raw.shopName, raw.businessName);
  const selectedProfessionId = firstNonEmpty(
    raw.selectedProfessionId,
    raw.professionId,
    raw.businessCategory,
    raw.category,
  );
  const phoneNumber = firstNonEmpty(raw.phoneNumber, raw.phone);
  const plan = normalizePlan(firstNonEmpty(raw.plan, raw.selectedPlan));
  const planApprovedByAdmin = raw.planApprovedByAdmin === true;
  const role = toRole(email, raw.role);
  return {
    ...raw,
    uid,
    email,
    ownerName,
    shopName,
    selectedProfessionId,
    phoneNumber,
    plan,
    planApprovedByAdmin,
    role,
    onboardingCompleted: Boolean(
      raw.onboardingCompleted
      || (ownerName && shopName && selectedProfessionId && phoneNumber),
    ),
  };
};

const syncAdminCollections = async (
  uid: string,
  payload: { email?: string | null; displayName?: string | null; ownerName?: string | null; shopName?: string | null },
) => {
  await Promise.all([
    setDoc(
      adminAccountRef(uid),
      sanitizeForFirestore({
        uid,
        email: payload.email ? payload.email.toLowerCase() : null,
        displayName: payload.displayName || null,
        ownerName: payload.ownerName || null,
        shopName: payload.shopName || null,
        role: 'admin',
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(
      adminManagementRef('overview'),
      sanitizeForFirestore({
        lastUpdatedBy: uid,
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(
      adminManagementRef('loginPolicy'),
      sanitizeForFirestore({
        allowedEmail: ADMIN_EMAIL,
        provider: 'firebase-auth-email-password',
        passwordManagedInFirebaseAuth: true,
        passwordStorage: 'not-stored-in-firestore',
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
  ]);
};

const analyticsReady = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);

export const trackPageView = async (path: string) => {
  const analytics = await analyticsReady;
  if (!analytics) return;
  logEvent(analytics, 'page_view', { page_path: path });
};

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    const code = String(error?.code || '');
    const host = (typeof window !== 'undefined' && window.location?.host) ? window.location.host : 'current host';
    if (code === 'auth/unauthorized-domain') {
      throw new Error(
        `Unauthorized domain (${host}). Add this host in Firebase Console > Authentication > Settings > Authorized domains.`,
      );
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Popup blocked by browser. Allow popups for this site and retry Google login.');
    }
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Google login popup was closed before completion.');
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error('Enable Google sign-in in Firebase Authentication > Sign-in method.');
    }
    throw error;
  }
};

export const signInAdmin = async (email: string, password: string): Promise<UserCredential> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) {
    throw new Error('Only admin@dxtoolz.com is allowed for admin login.');
  }
  if (password !== ADMIN_PASSWORD) {
    throw new Error('Invalid admin password.');
  }

  const ensureAdminMetadata = async (credential: UserCredential) => {
    await saveAdminProfile(credential.user.uid, {
      email: credential.user.email,
      displayName: credential.user.displayName,
      ownerName: '',
      shopName: '',
      plan: 'business',
    });
    return credential;
  };

  try {
    const credential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    return ensureAdminMetadata(credential);
  } catch (error: any) {
    const code = String(error?.code || '');
    if (code === 'auth/operation-not-allowed') {
      throw new Error('Enable Email/Password sign-in in Firebase Authentication > Sign-in method.');
    }
    if (code === 'auth/user-disabled') {
      throw new Error('Admin auth account is disabled in Firebase Authentication.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many admin login attempts. Try again after some time.');
    }

    const shouldTryBootstrap = code === 'auth/user-not-found'
      || code === 'auth/invalid-credential'
      || code === 'auth/invalid-login-credentials'
      || code === 'auth/wrong-password';

    if (!shouldTryBootstrap) throw error;

    try {
      const created = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      return ensureAdminMetadata(created);
    } catch (createError: any) {
      const createCode = String(createError?.code || '');
      if (createCode === 'auth/operation-not-allowed') {
        throw new Error('Enable Email/Password sign-in in Firebase Authentication > Sign-in method.');
      }
      if (createCode === 'auth/email-already-in-use') {
        throw new Error('Admin auth user already exists with a different password. Reset admin@dxtoolz.com password in Firebase Authentication to dx1stdemojs.');
      }
      throw createError;
    }
  }
};

export const observeAuthUser = (handler: (user: User | null) => void) => {
  return onAuthStateChanged(auth, handler);
};

export const signOutFirebase = async () => {
  await signOut(auth);
};

export const saveUserProfile = async (
  uid: string,
  profile: {
    email?: string | null;
    displayName?: string | null;
    ownerName?: string;
    phoneNumber?: string;
    shopName?: string;
    selectedProfessionId?: string | null;
    plan?: UserPlan;
    planApprovedByAdmin?: boolean;
    role?: UserRole;
    onboardingCompleted?: boolean;
  },
) => {
  const email = profile.email ? profile.email.toLowerCase() : null;
  const role = toRole(email, profile.role);
  const normalizedPlan = normalizePlan(profile.plan);
  const planApprovedByAdmin = profile.planApprovedByAdmin;
  const safeProfessionId = role === 'admin'
    ? 'admin'
    : (profile.selectedProfessionId === 'admin' ? null : (profile.selectedProfessionId || null));
  const onboardingCompleted = Boolean(
    profile.onboardingCompleted
    || (profile.ownerName && profile.shopName && profile.selectedProfessionId && profile.phoneNumber),
  );
  const payload = {
    uid,
    email,
    displayName: profile.displayName || null,
    ownerName: profile.ownerName || null,
    phoneNumber: profile.phoneNumber || null,
    shopName: profile.shopName || null,
    selectedProfessionId: safeProfessionId,
    plan: normalizedPlan,
    role,
    onboardingCompleted,
    updatedAt: serverTimestamp(),
  };
  if (planApprovedByAdmin !== undefined) {
    (payload as any).planApprovedByAdmin = Boolean(planApprovedByAdmin);
  }

  await Promise.all([
    setDoc(
      legacyUserRef(uid),
      sanitizeForFirestore({
        uid,
        role,
        plan: normalizedPlan,
        planStatus: 'active',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(profileRef(uid), sanitizeForFirestore(payload), { merge: true }),
  ]);

  if (role === 'admin') {
    await syncAdminCollections(uid, {
      email,
      displayName: profile.displayName || null,
      ownerName: profile.ownerName || null,
      shopName: profile.shopName || null,
    });
  }
};

export const saveAdminProfile = async (
  uid: string,
  profile: {
    email?: string | null;
    displayName?: string | null;
    ownerName?: string;
    phoneNumber?: string;
    shopName?: string;
    plan?: UserPlan;
  },
) => {
  await saveUserProfile(uid, {
    ...profile,
    role: 'admin',
    plan: normalizePlan(profile.plan || 'business'),
    planApprovedByAdmin: true,
  });
};

export const createInitialUserProfile = async (
  uid: string,
  payload: {
    email?: string | null;
    displayName?: string | null;
    ownerName: string;
    phoneNumber: string;
    shopName: string;
    selectedProfessionId: string;
    plan: UserPlan;
    role?: UserRole;
  },
) => {
  const existing = await getUserProfile(uid);
  if (existing?.onboardingCompleted) return existing;

  const normalizedExisting = normalizeProfilePayload(uid, existing || null);
  const ownerName = payload.ownerName || normalizedExisting?.ownerName || '';
  const shopName = payload.shopName || normalizedExisting?.shopName || '';
  const selectedProfessionId = payload.selectedProfessionId || normalizedExisting?.selectedProfessionId || '';
  const phoneNumber = payload.phoneNumber || normalizedExisting?.phoneNumber || '';
  const email = payload.email ? payload.email.toLowerCase() : null;
  const role = toRole(payload.email || normalizedExisting?.email, payload.role || normalizedExisting?.role);
  const safeSelectedProfessionId = role === 'admin'
    ? 'admin'
    : (selectedProfessionId === 'admin' ? '' : selectedProfessionId);
  const plan = normalizePlan(payload.plan || normalizedExisting?.plan);
  const planApprovedByAdmin = role === 'admin';

  await Promise.all([
    setDoc(
      legacyUserRef(uid),
      sanitizeForFirestore({
        uid,
        role,
        plan,
        planStatus: 'active',
        createdAt: (existing as any)?.createdAt || serverTimestamp(),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(
      profileRef(uid),
      sanitizeForFirestore({
        uid,
        email,
        displayName: payload.displayName || null,
        ownerName,
        phoneNumber,
        shopName,
        selectedProfessionId: safeSelectedProfessionId,
        plan,
        planApprovedByAdmin,
        role,
        onboardingCompleted: true,
        createdAt: (existing as any)?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
  ]);

  if (role === 'admin') {
    await syncAdminCollections(uid, {
      email,
      displayName: payload.displayName || null,
      ownerName,
      shopName,
    });
  }
  return getUserProfile(uid);
};

export const getUserProfile = async (uid: string, _isAdmin = false) => {
  try {
    const snap = await getDoc(profileRef(uid));
    if (snap.exists()) {
      return normalizeProfilePayload(uid, snap.data() as any);
    }

    const legacySnap = await getDoc(legacyUserRef(uid));
    if (!legacySnap.exists()) return null;

    const legacyPayload = normalizeProfilePayload(uid, legacySnap.data() as any);
    if (!legacyPayload) return null;

    await setDoc(
      profileRef(uid),
      sanitizeForFirestore({
        ...legacyPayload,
        migratedFromLegacy: true,
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    return legacyPayload;
  } catch {
    return null;
  }
};

export const savePlanAndPhone = async (uid: string, plan: UserPlan, phoneNumber?: string) => {
  const normalizedPlan = normalizePlan(plan);
  const profile = await getUserProfile(uid);
  const isAdminProfile = profile?.role === 'admin';
  const planApprovedByAdmin = isAdminProfile
    ? true
    : Boolean(profile?.planApprovedByAdmin && normalizedPlan === normalizePlan(profile?.plan));
  const planStatus = isAdminProfile
    ? 'active'
    : (normalizedPlan === 'free' ? 'active' : 'pending');
  await Promise.all([
    setDoc(
      legacyUserRef(uid),
      sanitizeForFirestore({
        uid,
        plan: normalizedPlan,
        planStatus,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(
      profileRef(uid),
      sanitizeForFirestore({
        plan: normalizedPlan,
        planApprovedByAdmin,
        phoneNumber: phoneNumber || null,
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
  ]);
};

export const adminUpdateUserPlan = async (uidOrDocId: string, plan: UserPlan, emailHint?: string) => {
  const normalizedPlan = normalizePlan(plan);
  const planApprovedByAdmin = normalizedPlan === 'pro' || normalizedPlan === 'business';
  let resolvedUid = uidOrDocId;
  let profile = await getUserProfile(resolvedUid);
  if (!profile && emailHint) {
    try {
      const byEmailSnap = await getDocs(query(collectionGroup(db, 'profile'), where('email', '==', emailHint.toLowerCase()), limit(1)));
      if (!byEmailSnap.empty) {
        const data = byEmailSnap.docs[0].data() as any;
        const possibleUid = String(byEmailSnap.docs[0].ref.parent.parent?.id || data?.uid || '').trim();
        if (possibleUid) {
          resolvedUid = possibleUid;
          profile = await getUserProfile(resolvedUid);
        }
      }
    } catch {
      // no-op
    }
  }
  if (!profile) throw new Error('User profile not found.');
  const previousPlan = normalizePlan(profile.plan);
  const planChanged = previousPlan !== normalizedPlan;

  await Promise.all([
    setDoc(
      legacyUserRef(resolvedUid),
      sanitizeForFirestore({
        uid: resolvedUid,
        plan: normalizedPlan,
        planStatus: 'active',
        ...(planChanged ? { planAssignedAt: serverTimestamp() } : {}),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(
      profileRef(resolvedUid),
      sanitizeForFirestore({
        plan: normalizedPlan,
        planApprovedByAdmin,
        ...(planChanged ? { planAssignedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
  ]);
};

export const getLatestSnapshot = async (uid: string, _isAdmin = false) => {
  const [dashboardSnap, inventorySnap, tasksSnap] = await Promise.all([
    getDoc(dashboardRef(uid)),
    getDoc(inventoryRef(uid)),
    getDoc(tasksRef(uid)),
  ]);

  if (!dashboardSnap.exists() && !inventorySnap.exists() && !tasksSnap.exists()) return null;

  const dashboardData = dashboardSnap.exists() ? dashboardSnap.data() : {};
  const inventoryData = inventorySnap.exists() ? inventorySnap.data() : {};
  const tasksData = tasksSnap.exists() ? tasksSnap.data() : {};

  return {
    data: {
      config: {
        ...(dashboardData as any).config,
        tasks: (tasksData as any).list || (dashboardData as any).config?.tasks || [],
      },
      inventory: (inventoryData as any).state || (dashboardData as any).inventory || { items: [] },
      repairs: (dashboardData as any).repairs || { tickets: [] },
      pos: (dashboardData as any).pos || { invoices: [] },
      business: (dashboardData as any).business || {
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
      },
      finance: (dashboardData as any).finance || { transactions: [] },
      customers: (dashboardData as any).customers || { list: [] },
    },
  };
};

export const syncUserDataToFirestore = async (uid: string, snapshot: any, _isAdmin = false) => {
  const nowIso = new Date().toISOString();
  const config = snapshot?.config || {};

  await Promise.all([
    setDoc(
      dashboardRef(uid),
      sanitizeForFirestore({
        syncedAt: nowIso,
        config: {
          ...config,
          plan: normalizePlan(config.plan),
        },
        repairs: snapshot?.repairs || { tickets: [] },
        pos: snapshot?.pos || { invoices: [] },
        business: snapshot?.business || {},
        finance: snapshot?.finance || { transactions: [] },
        customers: snapshot?.customers || { list: [] },
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(
      inventoryRef(uid),
      sanitizeForFirestore({
        syncedAt: nowIso,
        state: snapshot?.inventory || { items: [] },
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
    setDoc(
      tasksRef(uid),
      sanitizeForFirestore({
        syncedAt: nowIso,
        list: config.tasks || [],
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    ),
  ]);
};

export const observeUserWorkspace = (
  uid: string,
  handler: (value: { dashboard: any; inventory: any; tasks: any }) => void,
) => {
  const cache = {
    dashboard: null as any,
    inventory: null as any,
    tasks: null as any,
  };

  const emit = () => handler({ ...cache });

  const unsubs = [
    onSnapshot(dashboardRef(uid), (snap) => {
      cache.dashboard = snap.exists() ? snap.data() : null;
      emit();
    }),
    onSnapshot(inventoryRef(uid), (snap) => {
      cache.inventory = snap.exists() ? snap.data() : null;
      emit();
    }),
    onSnapshot(tasksRef(uid), (snap) => {
      cache.tasks = snap.exists() ? snap.data() : null;
      emit();
    }),
  ];

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
};

export const checkFirestoreConnection = async (uid: string, _isAdmin = false) => {
  try {
    await getDoc(profileRef(uid));
    await setDoc(
      dashboardRef(uid),
      { connectionCheckedAt: new Date().toISOString() },
      { merge: true },
    );
    return {
      ok: true,
      message: 'Connection is working. Firestore is reachable.',
    };
  } catch (error) {
    return {
      ok: false,
      message: toFirebaseSyncMessage(error),
    };
  }
};

export const toFirebaseSyncMessage = (error: unknown) => {
  const raw = (error as any)?.message || String(error || '');
  const code = (error as any)?.code ? String((error as any).code) : '';
  const text = raw.toLowerCase();

  if (text.includes('err_blocked_by_client') || text.includes('blocked')) {
    return 'Sync blocked by browser extension or shield. Turn it off for this site and retry.';
  }
  if (text.includes('permission-denied')) {
    return 'Firestore permission denied. Publish Firestore rules in Firebase Console, then retry.';
  }
  if (text.includes('unavailable') || text.includes('network')) {
    return 'Network issue while syncing. Check internet and retry.';
  }

  return `Sync failed. ${code || raw || 'Please retry.'}`;
};

export const savePaidInterestUser = async (payload: {
  uid?: string | null;
  ownerName: string;
  phoneNumber: string;
  businessName?: string;
  email?: string | null;
  requestedPlan: 'pro' | 'business_plus';
}) => {
  if (!payload.uid) {
    throw new Error('Auth user not available.');
  }
  const existingByUser = await getDocs(query(collection(db, 'PaidInterests'), where('uid', '==', payload.uid)));
  const alreadyRequestedSamePlan = existingByUser.docs.some((item) => {
    const data = item.data() as any;
    return String(data?.requestedPlan || '') === payload.requestedPlan;
  });
  if (alreadyRequestedSamePlan) {
    throw new Error('Already requested');
  }
  const requestId = `${payload.uid}_${Date.now()}`;
  await setDoc(
    doc(db, 'PaidInterests', requestId),
    sanitizeForFirestore({
      requestId,
      uid: payload.uid,
      requestedPlan: payload.requestedPlan,
      phoneNumber: payload.phoneNumber,
      email: payload.email ? payload.email.toLowerCase() : null,
      businessName: payload.businessName || null,
      ownerName: payload.ownerName || null,
      createdAt: serverTimestamp(),
    }),
    { merge: false },
  );
  return requestId;
};

export const fetchAdminAnalyticsData = async () => {
  const toMillis = (value: any): number | null => {
    if (!value) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    return null;
  };
  const dayDiffFromNow = (millis: number | null) => {
    if (!millis) return null;
    const diff = Date.now() - millis;
    return diff < 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const [usersSnap, paidInterestsSnap, adminAccountsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'PaidInterests')),
    getDocs(collection(db, 'adminAccounts')),
  ]);

  const usersRaw = await Promise.all(usersSnap.docs.map(async (docItem) => {
    const uid = docItem.id;
    const legacyData = docItem.data() as any;
    try {
      const profileSnap = await getDoc(profileRef(uid));
      if (profileSnap.exists()) {
        return normalizeProfilePayload(uid, profileSnap.data() as any);
      }
    } catch {
      // fallback to legacy data below
    }
    return normalizeProfilePayload(uid, legacyData);
  }));

  const users = usersRaw.filter(Boolean).map((data: any) => {
    const email = (data.email || '').toLowerCase();
    const role = data.role === 'admin' || deriveRoleFromEmail(email) === 'admin' ? 'admin' : 'user';
    const uid = data.uid;
    const planAssignedAtMs = toMillis(data.planAssignedAt || data.updatedAt || null);
    return {
      id: uid,
      uid,
      email,
      ownerName: data.ownerName || '',
      shopName: data.shopName || '',
      phoneNumber: data.phoneNumber || '',
      category: role === 'admin' ? 'admin' : (data.selectedProfessionId || ''),
      plan: normalizePlan(data.plan || 'free'),
      planApprovedByAdmin: data.planApprovedByAdmin === true,
      planAssignedAtMs,
      planActiveDays: dayDiffFromNow(planAssignedAtMs),
      role,
      updatedAt: data.updatedAt || null,
    };
  });

  const categoryCounts: Record<string, number> = {};
  users.forEach((user) => {
    const key = user.category || 'unknown';
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || ['unknown', 0];

  const paidInterestUsers = paidInterestsSnap.docs
    .map((item) => {
      const raw = item.data() as any;
      const createdAtMs = toMillis(raw.createdAt || null);
      return {
        id: item.id,
        ...raw,
        createdAtMs,
      };
    })
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  const paidUsersSummary = users.filter((item) =>
    (item.plan === 'pro' || item.plan === 'business') && item.planApprovedByAdmin === true,
  ).sort((a, b) => (a.planActiveDays ?? Number.MAX_SAFE_INTEGER) - (b.planActiveDays ?? Number.MAX_SAFE_INTEGER));
  const adminAccounts = adminAccountsSnap.docs.map((item) => ({
    id: item.id,
    ...(item.data() as any),
  }));

  return {
    totals: {
      users: users.length,
      paidInterestUsers: paidInterestUsers.length,
      paidUsers: paidUsersSummary.length,
      topCategory: topCategory[0],
      topCategoryCount: topCategory[1],
      adminAccounts: adminAccounts.length,
    },
    users,
    paidInterestUsers,
    paidUsersSummary,
    adminAccounts,
  };
};
