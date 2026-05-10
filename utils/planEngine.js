import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, } from 'firebase/firestore';
import { db } from './firebase';
import { normalizePlan } from './plans';
export const DEFAULT_PLAN_DOCS = {
    free: {
        name: 'Free',
        features: {
            featureA: false,
            featureB: false,
            limits: { maxCustomTools: 0 },
        },
        storageMode: 'temporary',
    },
    pro: {
        name: 'Pro',
        features: {
            featureA: true,
            featureB: true,
            limits: { maxCustomTools: 25 },
        },
        storageMode: 'hybrid',
    },
    business: {
        name: 'Business+',
        features: {
            featureA: true,
            featureB: true,
            limits: { maxCustomTools: 9999 },
        },
        storageMode: 'hybrid',
    },
};
const userAccountRef = (uid) => doc(db, 'users', uid);
const userProfileRef = (uid) => doc(db, 'users', uid, 'profile', 'data');
const planRef = (planId) => doc(db, 'plans', planId);
export const ensureUserAccountDocument = async (params) => {
    const normalizedPlan = normalizePlan(params.plan);
    const requestedRole = params.role === 'admin' ? 'admin' : 'user';
    const nextPlan = requestedRole === 'admin' ? 'business' : normalizedPlan;
    const ref = userAccountRef(params.uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : null;
    const role = existing?.role === 'admin' ? 'admin' : requestedRole;
    const plan = normalizePlan(existing?.plan || nextPlan);
    const createdAt = existing?.createdAt || serverTimestamp();
    const planStatus = existing?.planStatus === 'pending' ? 'pending' : 'active';
    await setDoc(ref, {
        uid: params.uid,
        role,
        plan,
        planStatus,
        createdAt,
        lastLogin: serverTimestamp(),
    }, { merge: true });
    return { role, plan, planStatus };
};
export const getPlanDocument = async (plan) => {
    const normalized = normalizePlan(plan);
    const snap = await getDoc(planRef(normalized));
    if (!snap.exists())
        return DEFAULT_PLAN_DOCS[normalized];
    const data = snap.data();
    return {
        name: data.name || DEFAULT_PLAN_DOCS[normalized].name,
        features: data.features || DEFAULT_PLAN_DOCS[normalized].features,
        storageMode: data.storageMode || DEFAULT_PLAN_DOCS[normalized].storageMode,
    };
};
export const observeUserPlanChanges = (uid, onChange) => {
    return onSnapshot(userAccountRef(uid), async (snap) => {
        const raw = snap.exists() ? snap.data() : null;
        const role = raw?.role === 'admin' ? 'admin' : 'user';
        const defaultPlan = role === 'admin' ? 'business' : 'free';
        const plan = normalizePlan(raw?.plan || defaultPlan);
        const planStatus = raw?.planStatus === 'pending' ? 'pending' : 'active';
        const planDoc = await getPlanDocument(plan);
        onChange({ role, plan, planStatus, storageMode: planDoc.storageMode });
    });
};
export const updateUserPlanByAdmin = async (uid, plan) => {
    const normalizedPlan = normalizePlan(plan);
    await Promise.all([
        setDoc(userAccountRef(uid), { plan: normalizedPlan, planStatus: 'active', lastLogin: serverTimestamp() }, { merge: true }),
        setDoc(userProfileRef(uid), { plan: normalizedPlan, planApprovedByAdmin: normalizedPlan !== 'free', updatedAt: serverTimestamp() }, { merge: true }),
    ]);
};
