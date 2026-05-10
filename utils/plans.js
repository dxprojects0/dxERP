export const normalizePlan = (plan) => {
    if (plan === 'pro')
        return 'pro';
    if (plan === 'business' || plan === 'business_plus')
        return 'business';
    return 'free';
};
export const isPaidPlan = (plan) => {
    const normalized = normalizePlan(plan);
    return normalized === 'pro' || normalized === 'business';
};
export const deriveRoleFromEmail = (email) => (email || '').toLowerCase() === 'admin@dxtoolz.com' ? 'admin' : 'user';
