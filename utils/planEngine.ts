import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizePlan, UserPlan, UserRole } from './plans';

export type StorageMode = 'temporary' | 'hybrid' | 'persistent';
export type PlanStatus = 'active' | 'pending';
export interface UserAccountDoc {
  uid: string;
  role: UserRole;
  plan: UserPlan;
  planStatus: PlanStatus;
  createdAt?: Timestamp | null;
  lastLogin?: Timestamp | null;
}

export interface PlanDoc {
  name: string;
  features: Record<string, any>;
  storageMode: StorageMode;
}

export const DEFAULT_PLAN_DOCS: Record<UserPlan, PlanDoc> = {
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

const userAccountRef = (uid: string) => doc(db, 'users', uid);
const userProfileRef = (uid: string) => doc(db, 'users', uid, 'profile', 'data');
const planRef = (planId: UserPlan) => doc(db, 'plans', planId);

export const ensureUserAccountDocument = async (params: {
  uid: string;
  role: UserRole;
  plan?: UserPlan;
}) => {
  const normalizedPlan = normalizePlan(params.plan);
  const requestedRole = params.role === 'admin' ? 'admin' : 'user';
  const nextPlan: UserPlan = requestedRole === 'admin' ? 'business' : normalizedPlan;
  const ref = userAccountRef(params.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as Partial<UserAccountDoc>) : null;
  const role: UserRole = existing?.role === 'admin' ? 'admin' : requestedRole;
  const plan: UserPlan = normalizePlan(existing?.plan || nextPlan);
  const createdAt = existing?.createdAt || serverTimestamp();
  const planStatus: PlanStatus = existing?.planStatus === 'pending' ? 'pending' : 'active';
  await setDoc(
    ref,
    {
      uid: params.uid,
      role,
      plan,
      planStatus,
      createdAt,
      lastLogin: serverTimestamp(),
    },
    { merge: true },
  );
  return { role, plan, planStatus };
};

export const getPlanDocument = async (plan: UserPlan): Promise<PlanDoc> => {
  const normalized = normalizePlan(plan);
  const snap = await getDoc(planRef(normalized));
  if (!snap.exists()) return DEFAULT_PLAN_DOCS[normalized];
  const data = snap.data() as Partial<PlanDoc>;
  return {
    name: data.name || DEFAULT_PLAN_DOCS[normalized].name,
    features: data.features || DEFAULT_PLAN_DOCS[normalized].features,
    storageMode: (data.storageMode as StorageMode) || DEFAULT_PLAN_DOCS[normalized].storageMode,
  };
};

export const observeUserPlanChanges = (
  uid: string,
  onChange: (value: { role: UserRole; plan: UserPlan; planStatus: PlanStatus; storageMode: StorageMode }) => void,
) => {
  return onSnapshot(userAccountRef(uid), async (snap) => {
    const raw = snap.exists() ? (snap.data() as Partial<UserAccountDoc>) : null;
    const role: UserRole = raw?.role === 'admin' ? 'admin' : 'user';
    const defaultPlan: UserPlan = role === 'admin' ? 'business' : 'free';
    const plan = normalizePlan(raw?.plan || defaultPlan);
    const planStatus: PlanStatus = raw?.planStatus === 'pending' ? 'pending' : 'active';
    const planDoc = await getPlanDocument(plan);
    onChange({ role, plan, planStatus, storageMode: planDoc.storageMode });
  });
};

export const updateUserPlanByAdmin = async (uid: string, plan: UserPlan) => {
  const normalizedPlan = normalizePlan(plan);
  await Promise.all([
    setDoc(
      userAccountRef(uid),
      { plan: normalizedPlan, planStatus: 'active', lastLogin: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      userProfileRef(uid),
      { plan: normalizedPlan, planApprovedByAdmin: normalizedPlan !== 'free', updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
};
