import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, getAuth, signOut, signInWithPopup, } from 'firebase/auth';
import { collection, collectionGroup, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, query, serverTimestamp, setDoc, where, } from 'firebase/firestore';
import { deriveRoleFromEmail, normalizePlan } from './plans';
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
const profileRef = (uid) => doc(db, 'users', uid, 'profile', 'data');
const dashboardRef = (uid) => doc(db, 'users', uid, 'dashboard', 'data');
const inventoryRef = (uid) => doc(db, 'users', uid, 'inventory', 'data');
const tasksRef = (uid) => doc(db, 'users', uid, 'tasks', 'data');
const legacyUserRef = (uid) => doc(db, 'users', uid);
const userSummaryRef = (uid) => doc(db, 'usersSummary', uid);
const adminAccountRef = (uid) => doc(db, 'adminAccounts', uid);
const adminManagementRef = (docId) => doc(db, 'adminManagement', docId);
const slugifyKey = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unknown';
const sanitizeForFirestore = (value) => {
    if (value === undefined)
        return null;
    if (value === null)
        return null;
    if (Array.isArray(value))
        return value.map((item) => sanitizeForFirestore(item));
    if (typeof value === 'object') {
        const next = {};
        Object.entries(value).forEach(([key, val]) => {
            const cleaned = sanitizeForFirestore(val);
            if (cleaned !== undefined)
                next[key] = cleaned;
        });
        return next;
    }
    return value;
};
const toRole = (email, role) => {
    const emailRole = deriveRoleFromEmail(email);
    if (emailRole === 'admin')
        return 'admin';
    if (role === 'admin')
        return 'user';
    return role || 'user';
};
const firstNonEmpty = (...values) => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim())
            return value.trim();
    }
    return null;
};
const normalizeProfilePayload = (uid, raw) => {
    if (!raw)
        return null;
    const email = firstNonEmpty(raw.email)?.toLowerCase() || null;
    const ownerName = firstNonEmpty(raw.ownerName, raw.name, raw.contactName);
    const shopName = firstNonEmpty(raw.shopName, raw.businessName);
    const selectedProfessionId = firstNonEmpty(raw.selectedProfessionId, raw.professionId, raw.businessCategory, raw.category);
    const phoneNumber = firstNonEmpty(raw.phoneNumber, raw.phone);
    const profileLocked = raw.profileLocked === true;
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
        profileLocked,
        plan,
        planApprovedByAdmin,
        role,
        onboardingCompleted: Boolean(raw.onboardingCompleted
            || (ownerName && shopName && selectedProfessionId && phoneNumber)),
    };
};
export const getUserProfileByEmail = async (email) => {
    const emailLower = String(email || '').trim().toLowerCase();
    if (!emailLower)
        return null;
    try {
        const byEmailSnap = await getDocs(query(collectionGroup(db, 'profile'), where('email', '==', emailLower), limit(1)));
        if (byEmailSnap.empty)
            return null;
        const data = byEmailSnap.docs[0].data();
        const resolvedUid = String(byEmailSnap.docs[0].ref.parent.parent?.id || data?.uid || '').trim();
        if (!resolvedUid)
            return null;
        return normalizeProfilePayload(resolvedUid, data);
    }
    catch {
        return null;
    }
};
const syncAdminCollections = async (uid, payload) => {
    await Promise.all([
        setDoc(adminAccountRef(uid), sanitizeForFirestore({
            uid,
            email: payload.email ? payload.email.toLowerCase() : null,
            displayName: payload.displayName || null,
            ownerName: payload.ownerName || null,
            shopName: payload.shopName || null,
            role: 'admin',
            updatedAt: serverTimestamp(),
        }), { merge: true }),
        setDoc(adminManagementRef('overview'), sanitizeForFirestore({
            lastUpdatedBy: uid,
            updatedAt: serverTimestamp(),
        }), { merge: true }),
        setDoc(adminManagementRef('loginPolicy'), sanitizeForFirestore({
            allowedEmail: ADMIN_EMAIL,
            provider: 'firebase-auth-email-password',
            passwordManagedInFirebaseAuth: true,
            passwordStorage: 'not-stored-in-firestore',
            updatedBy: uid,
            updatedAt: serverTimestamp(),
        }), { merge: true }),
    ]);
};
const analyticsReady = isSupported()
    .then((supported) => (supported ? getAnalytics(app) : null))
    .catch(() => null);
export const trackPageView = async (path) => {
    const analytics = await analyticsReady;
    if (!analytics)
        return;
    logEvent(analytics, 'page_view', { page_path: path });
};
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    }
    catch (error) {
        const code = String(error?.code || '');
        const host = (typeof window !== 'undefined' && window.location?.host) ? window.location.host : 'current host';
        if (code === 'auth/unauthorized-domain') {
            throw new Error(`Unauthorized domain (${host}). Add this host in Firebase Console > Authentication > Settings > Authorized domains.`);
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
export const signInAdmin = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== ADMIN_EMAIL) {
        throw new Error('Only admin@dxtoolz.com is allowed for admin login.');
    }
    if (password !== ADMIN_PASSWORD) {
        throw new Error('Invalid admin password.');
    }
    const ensureAdminMetadata = async (credential) => {
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
    }
    catch (error) {
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
        if (!shouldTryBootstrap)
            throw error;
        try {
            const created = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
            return ensureAdminMetadata(created);
        }
        catch (createError) {
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
export const observeAuthUser = (handler) => {
    return onAuthStateChanged(auth, handler);
};
export const signOutFirebase = async () => {
    await signOut(auth);
};
export const saveUserProfile = async (uid, profile) => {
    const email = profile.email ? profile.email.toLowerCase() : null;
    const existingProfile = await getUserProfile(uid);
    const role = toRole(email, profile.role);
    const normalizedPlan = normalizePlan(profile.plan);
    const planApprovedByAdmin = profile.planApprovedByAdmin;
    const nextOwnerName = profile.ownerName || existingProfile?.ownerName || null;
    const nextPhoneNumber = profile.phoneNumber || existingProfile?.phoneNumber || null;
    const nextShopName = profile.shopName || existingProfile?.shopName || null;
    const profileLocked = profile.profileLocked === true;
    const safeProfessionId = role === 'admin'
        ? 'admin'
        : (profile.selectedProfessionId === 'admin' ? null : (profile.selectedProfessionId || null));
    const onboardingCompleted = Boolean(profile.onboardingCompleted
        || (nextOwnerName && nextShopName && safeProfessionId && nextPhoneNumber));
    const payload = {
        uid,
        email,
        name: nextOwnerName,
        businessName: nextShopName,
        displayName: profile.displayName || null,
        ownerName: nextOwnerName,
        phoneNumber: nextPhoneNumber,
        shopName: nextShopName,
        profileLocked,
        selectedProfessionId: safeProfessionId,
        plan: normalizedPlan,
        role,
        onboardingCompleted,
        updatedAt: serverTimestamp(),
    };
    if (planApprovedByAdmin !== undefined) {
        payload.planApprovedByAdmin = Boolean(planApprovedByAdmin);
    }
    await setDoc(profileRef(uid), sanitizeForFirestore(payload), { merge: true });
    try {
        await setDoc(userSummaryRef(uid), sanitizeForFirestore({
            uid,
            email,
            ownerName: nextOwnerName,
            shopName: nextShopName,
            phoneNumber: nextPhoneNumber,
            role,
            category: safeProfessionId,
            plan: normalizedPlan,
            planApprovedByAdmin: planApprovedByAdmin === true,
            displayLabel: [nextOwnerName, email].filter(Boolean).join(' | '),
            businessLabel: [nextShopName, email].filter(Boolean).join(' | '),
            updatedAt: serverTimestamp(),
        }), { merge: true });
    }
    catch {
        // Keep profile edits working even if the summary collection rules are not deployed yet.
    }
    try {
        await setDoc(legacyUserRef(uid), sanitizeForFirestore({
            uid,
            email,
            ownerName: nextOwnerName,
            shopName: nextShopName,
            role,
            plan: normalizedPlan,
            planStatus: 'active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }), { merge: true });
    }
    catch {
        // Profile save is the priority path. Some environments may reject the legacy mirror write.
    }
    if (role === 'admin') {
        try {
            await syncAdminCollections(uid, {
                email,
                displayName: profile.displayName || null,
                ownerName: profile.ownerName || null,
                shopName: profile.shopName || null,
            });
        }
        catch {
            // no-op
        }
    }
};
export const saveEditableProfileFields = async (uid, profile) => {
    const email = profile.email ? profile.email.toLowerCase() : null;
    const existingProfile = await getUserProfile(uid);
    const nextOwnerName = profile.ownerName || existingProfile?.ownerName || null;
    const nextPhoneNumber = profile.phoneNumber || existingProfile?.phoneNumber || null;
    const nextShopName = profile.shopName || existingProfile?.shopName || null;
    const nextCategory = profile.selectedProfessionId === undefined
        ? (existingProfile?.selectedProfessionId || null)
        : profile.selectedProfessionId;
    await setDoc(profileRef(uid), sanitizeForFirestore({
        uid,
        email,
        name: nextOwnerName,
        businessName: nextShopName,
        displayName: profile.displayName || null,
        ownerName: nextOwnerName,
        phoneNumber: nextPhoneNumber,
        shopName: nextShopName,
        selectedProfessionId: nextCategory,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
    }), { merge: true });
    try {
        await setDoc(userSummaryRef(uid), sanitizeForFirestore({
            uid,
            email,
            ownerName: nextOwnerName,
            shopName: nextShopName,
            phoneNumber: nextPhoneNumber,
            category: nextCategory,
            displayLabel: [nextOwnerName, email].filter(Boolean).join(' | '),
            businessLabel: [nextShopName, email].filter(Boolean).join(' | '),
            updatedAt: serverTimestamp(),
        }), { merge: true });
    }
    catch {
        // no-op
    }
    try {
        await setDoc(legacyUserRef(uid), sanitizeForFirestore({
            uid,
            email,
            ownerName: nextOwnerName,
            shopName: nextShopName,
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }), { merge: true });
    }
    catch {
        // no-op
    }
};
export const saveAdminProfile = async (uid, profile) => {
    await saveUserProfile(uid, {
        ...profile,
        role: 'admin',
        plan: normalizePlan(profile.plan || 'business'),
        planApprovedByAdmin: true,
    });
};
export const createInitialUserProfile = async (uid, payload) => {
    const existing = await getUserProfile(uid);
    if (existing?.onboardingCompleted)
        return existing;
    const emailLower = payload.email ? payload.email.toLowerCase() : null;
    if (emailLower) {
        const dupSnap = await getDocs(query(collectionGroup(db, 'profile'), where('email', '==', emailLower), limit(1)));
        if (!dupSnap.empty && dupSnap.docs[0].ref.path.indexOf(uid) === -1) {
            throw new Error('An account already exists with this email. Please sign in instead.');
        }
    }
    const normalizedExisting = normalizeProfilePayload(uid, existing || null);
    const ownerName = payload.ownerName || normalizedExisting?.ownerName || '';
    const shopName = payload.shopName || normalizedExisting?.shopName || '';
    const selectedProfessionId = payload.selectedProfessionId || normalizedExisting?.selectedProfessionId || '';
    const phoneNumber = payload.phoneNumber || normalizedExisting?.phoneNumber || '';
    const email = emailLower;
    const role = toRole(payload.email || normalizedExisting?.email, payload.role || normalizedExisting?.role);
    const safeSelectedProfessionId = role === 'admin'
        ? 'admin'
        : (selectedProfessionId === 'admin' ? '' : selectedProfessionId);
    const plan = normalizePlan(payload.plan || normalizedExisting?.plan);
    const planApprovedByAdmin = role === 'admin';
    await Promise.all([
        setDoc(legacyUserRef(uid), sanitizeForFirestore({
            uid,
            role,
            plan,
            planStatus: 'active',
            createdAt: existing?.createdAt || serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }), { merge: true }),
        setDoc(profileRef(uid), sanitizeForFirestore({
            uid,
            email,
            name: ownerName,
            businessName: shopName,
            displayName: payload.displayName || null,
            ownerName,
            phoneNumber,
            shopName,
            profileLocked: false,
            selectedProfessionId: safeSelectedProfessionId,
            plan,
            planApprovedByAdmin,
            role,
            onboardingCompleted: true,
            createdAt: existing?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
        }), { merge: true }),
    ]);
    try {
        await setDoc(userSummaryRef(uid), sanitizeForFirestore({
            uid,
            email,
            ownerName,
            shopName,
            phoneNumber,
            role,
            category: safeSelectedProfessionId,
            plan,
            planApprovedByAdmin,
            displayLabel: [ownerName, email].filter(Boolean).join(' | '),
            businessLabel: [shopName, email].filter(Boolean).join(' | '),
            updatedAt: serverTimestamp(),
        }), { merge: true });
    }
    catch {
        // no-op
    }
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
export const getUserProfile = async (uid, _isAdmin = false) => {
    try {
        const snap = await getDoc(profileRef(uid));
        if (snap.exists()) {
            return normalizeProfilePayload(uid, snap.data());
        }
        const legacySnap = await getDoc(legacyUserRef(uid));
        if (!legacySnap.exists())
            return null;
        const legacyPayload = normalizeProfilePayload(uid, legacySnap.data());
        if (!legacyPayload)
            return null;
        await setDoc(profileRef(uid), sanitizeForFirestore({
            ...legacyPayload,
            migratedFromLegacy: true,
            updatedAt: serverTimestamp(),
        }), { merge: true });
        return legacyPayload;
    }
    catch {
        return null;
    }
};
export const savePlanAndPhone = async (uid, plan, phoneNumber) => {
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
        setDoc(legacyUserRef(uid), sanitizeForFirestore({
            uid,
            plan: normalizedPlan,
            planStatus,
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }), { merge: true }),
        setDoc(profileRef(uid), sanitizeForFirestore({
            plan: normalizedPlan,
            planApprovedByAdmin,
            phoneNumber: phoneNumber || null,
            updatedAt: serverTimestamp(),
        }), { merge: true }),
    ]);
};
export const adminUpdateUserPlan = async (uidOrDocId, plan, emailHint) => {
    const normalizedPlan = normalizePlan(plan);
    const planApprovedByAdmin = normalizedPlan === 'pro' || normalizedPlan === 'business';
    let resolvedUid = uidOrDocId;
    let profile = await getUserProfile(resolvedUid);
    if (!profile && emailHint) {
        try {
            const byEmailSnap = await getDocs(query(collectionGroup(db, 'profile'), where('email', '==', emailHint.toLowerCase()), limit(1)));
            if (!byEmailSnap.empty) {
                const data = byEmailSnap.docs[0].data();
                const possibleUid = String(byEmailSnap.docs[0].ref.parent.parent?.id || data?.uid || '').trim();
                if (possibleUid) {
                    resolvedUid = possibleUid;
                    profile = await getUserProfile(resolvedUid);
                }
            }
        }
        catch {
            // no-op
        }
    }
    if (!profile)
        throw new Error('User profile not found.');
    const previousPlan = normalizePlan(profile.plan);
    const planChanged = previousPlan !== normalizedPlan;
    await Promise.all([
        setDoc(legacyUserRef(resolvedUid), sanitizeForFirestore({
            uid: resolvedUid,
            plan: normalizedPlan,
            planStatus: 'active',
            ...(planChanged ? { planAssignedAt: serverTimestamp() } : {}),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }), { merge: true }),
        setDoc(profileRef(resolvedUid), sanitizeForFirestore({
            plan: normalizedPlan,
            planApprovedByAdmin,
            ...(planChanged ? { planAssignedAt: serverTimestamp() } : {}),
            updatedAt: serverTimestamp(),
        }), { merge: true }),
    ]);
};
export const getLatestSnapshot = async (uid, _isAdmin = false) => {
    const [dashboardSnap, inventorySnap, tasksSnap] = await Promise.all([
        getDoc(dashboardRef(uid)),
        getDoc(inventoryRef(uid)),
        getDoc(tasksRef(uid)),
    ]);
    if (!dashboardSnap.exists() && !inventorySnap.exists() && !tasksSnap.exists())
        return null;
    const dashboardData = dashboardSnap.exists() ? dashboardSnap.data() : {};
    const inventoryData = inventorySnap.exists() ? inventorySnap.data() : {};
    const tasksData = tasksSnap.exists() ? tasksSnap.data() : {};
    return {
        data: {
            config: {
                ...dashboardData.config,
                tasks: tasksData.list || dashboardData.config?.tasks || [],
            },
            inventory: inventoryData.state || dashboardData.inventory || { items: [] },
            repairs: dashboardData.repairs || { tickets: [] },
            pos: dashboardData.pos || { invoices: [] },
            business: dashboardData.business || {
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
            finance: dashboardData.finance || { transactions: [] },
            customers: dashboardData.customers || { list: [] },
        },
    };
};
export const syncUserDataToFirestore = async (uid, snapshot, _isAdmin = false) => {
    const nowIso = new Date().toISOString();
    const config = snapshot?.config || {};
    await Promise.all([
        setDoc(dashboardRef(uid), sanitizeForFirestore({
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
        }), { merge: true }),
        setDoc(inventoryRef(uid), sanitizeForFirestore({
            syncedAt: nowIso,
            state: snapshot?.inventory || { items: [] },
            updatedAt: serverTimestamp(),
        }), { merge: true }),
        setDoc(tasksRef(uid), sanitizeForFirestore({
            syncedAt: nowIso,
            list: config.tasks || [],
            updatedAt: serverTimestamp(),
        }), { merge: true }),
    ]);
};
export const observeUserWorkspace = (uid, handler) => {
    const cache = {
        dashboard: null,
        inventory: null,
        tasks: null,
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
export const checkFirestoreConnection = async (uid, _isAdmin = false) => {
    try {
        await getDoc(profileRef(uid));
        await setDoc(dashboardRef(uid), { connectionCheckedAt: new Date().toISOString() }, { merge: true });
        return {
            ok: true,
            message: 'Connection is working. Firestore is reachable.',
        };
    }
    catch (error) {
        return {
            ok: false,
            message: toFirebaseSyncMessage(error),
        };
    }
};
export const toFirebaseSyncMessage = (error) => {
    const raw = error?.message || String(error || '');
    const code = error?.code ? String(error.code) : '';
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
export const savePaidInterestUser = async (payload) => {
    if (!payload.uid) {
        throw new Error('Auth user not available.');
    }
    const existingByUser = await getDocs(query(collection(db, 'PaidInterests'), where('uid', '==', payload.uid)));
    const alreadyRequestedSamePlan = existingByUser.docs.some((item) => {
        const data = item.data();
        return String(data?.requestedPlan || '') === payload.requestedPlan;
    });
    if (alreadyRequestedSamePlan) {
        throw new Error('Already requested');
    }
    const emailKey = slugifyKey(payload.email);
    const requestId = `${emailKey}_${payload.requestedPlan}`;
    await setDoc(doc(db, 'PaidInterests', requestId), sanitizeForFirestore({
        requestId,
        uid: payload.uid,
        requestedPlan: payload.requestedPlan,
        phoneNumber: payload.phoneNumber,
        email: payload.email ? payload.email.toLowerCase() : null,
        businessName: payload.businessName || null,
        ownerName: payload.ownerName || null,
        displayLabel: [payload.ownerName || null, payload.email ? payload.email.toLowerCase() : null].filter(Boolean).join(' | '),
        businessLabel: [payload.businessName || null, payload.email ? payload.email.toLowerCase() : null].filter(Boolean).join(' | '),
        createdAt: serverTimestamp(),
    }), { merge: false });
    return requestId;
};
export const fetchAdminAnalyticsData = async () => {
    const toMillis = (value) => {
        if (!value)
            return null;
        if (typeof value === 'number')
            return Number.isFinite(value) ? value : null;
        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        if (typeof value?.toMillis === 'function')
            return value.toMillis();
        if (typeof value?.seconds === 'number')
            return value.seconds * 1000;
        return null;
    };
    const dayDiffFromNow = (millis) => {
        if (!millis)
            return null;
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
        const legacyData = docItem.data();
        try {
            const profileSnap = await getDoc(profileRef(uid));
            if (profileSnap.exists()) {
                return normalizeProfilePayload(uid, profileSnap.data());
            }
        }
        catch {
            // fallback to legacy data below
        }
        return normalizeProfilePayload(uid, legacyData);
    }));
    const users = usersRaw.filter(Boolean).map((data) => {
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
    const categoryCounts = {};
    users.forEach((user) => {
        const key = user.category || 'unknown';
        categoryCounts[key] = (categoryCounts[key] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || ['unknown', 0];
    const paidInterestUsers = paidInterestsSnap.docs
        .map((item) => {
        const raw = item.data();
        const createdAtMs = toMillis(raw.createdAt || null);
        return {
            id: item.id,
            ...raw,
            createdAtMs,
        };
    })
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    const paidUsersSummary = users.filter((item) => (item.plan === 'pro' || item.plan === 'business') && item.planApprovedByAdmin === true).sort((a, b) => (a.planActiveDays ?? Number.MAX_SAFE_INTEGER) - (b.planActiveDays ?? Number.MAX_SAFE_INTEGER));
    const adminAccounts = adminAccountsSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
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
