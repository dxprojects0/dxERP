export type UserPlan = 'free' | 'pro' | 'business';
export type UserRole = 'user' | 'admin';

export const normalizePlan = (plan?: string | null): UserPlan => {
  if (plan === 'pro') return 'pro';
  if (plan === 'business' || plan === 'business_plus') return 'business';
  return 'free';
};

export const isPaidPlan = (plan?: string | null) => {
  const normalized = normalizePlan(plan);
  return normalized === 'pro' || normalized === 'business';
};

export const deriveRoleFromEmail = (email?: string | null): UserRole =>
  (email || '').toLowerCase() === 'admin@dxtoolz.com' ? 'admin' : 'user';
