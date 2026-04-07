import React, { useMemo, useState } from 'react';
import { RefreshCcw, Search } from 'lucide-react';
import { adminUpdateUserPlan, fetchAdminAnalyticsData } from '../utils/firebase';
import { emitToast } from '../utils/toast';

const formatPlanLabel = (plan?: string) => {
  if (plan === 'business' || plan === 'business_plus') return 'Business+';
  if (plan === 'pro') return 'Pro';
  return 'Free';
};

const formatRequestedPlanLabel = (plan?: string) => {
  if (plan === 'business_plus') return 'Business+';
  if (plan === 'pro') return 'Pro';
  return String(plan || '-');
};

const formatDateTime = (millis?: number | null) => {
  if (!millis) return '-';
  return new Date(millis).toLocaleString();
};

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<{
      totals: {
        users: number;
        paidInterestUsers: number;
        paidUsers: number;
        topCategory: string;
        topCategoryCount: number;
        adminAccounts?: number;
      };
    users: Array<{
      id: string;
      uid?: string;
      email: string;
      ownerName: string;
      shopName: string;
      category: string;
      plan: string;
      role?: string;
      phoneNumber?: string;
      planAssignedAtMs?: number | null;
      planActiveDays?: number | null;
    }>;
    paidInterestUsers: Array<Record<string, any>>;
    paidUsersSummary: Array<Record<string, any>>;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const snapshot = await fetchAdminAnalyticsData();
      setData(snapshot as any);
      emitToast({ variant: 'success', message: 'Admin analytics refreshed.' });
    } catch (error: any) {
      emitToast({ variant: 'error', message: error?.message || 'Failed to fetch admin analytics.' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const token = query.trim().toLowerCase();
    if (!token) return data.users;
    return data.users.filter((user) =>
      [user.email, user.ownerName, user.shopName, user.category, user.plan].some((item) =>
        String(item || '').toLowerCase().includes(token),
      ),
    );
  }, [data, query]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-24">
      <section className="bg-surface border border-app rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-black">Admin Analytics</h1>
            <p className="text-sm text-subtle">Registered users, top categories, paid-interest queue, and paid users summary.</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-primary-app text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCcw size={15} /> {loading ? 'Fetching...' : 'Refresh'}
          </button>
        </div>

        <div className="flex items-center gap-2 border border-app rounded-xl px-3 py-2">
          <Search size={15} className="text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search business, email, owner, category..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
      </section>

      {data && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="bg-surface border border-app rounded-xl p-4">
              <p className="text-xs text-subtle">Registered Users</p>
              <p className="text-2xl font-black">{data.totals.users}</p>
            </div>
            <div className="bg-surface border border-app rounded-xl p-4">
              <p className="text-xs text-subtle">Top Category</p>
              <p className="text-lg font-black uppercase">{data.totals.topCategory || '-'}</p>
              <p className="text-xs text-subtle">{data.totals.topCategoryCount} users</p>
            </div>
            <div className="bg-surface border border-app rounded-xl p-4">
              <p className="text-xs text-subtle">PaidInterestUser</p>
              <p className="text-2xl font-black">{data.totals.paidInterestUsers}</p>
            </div>
            <div className="bg-surface border border-app rounded-xl p-4">
              <p className="text-xs text-subtle">Paid Users</p>
              <p className="text-2xl font-black">{data.totals.paidUsers}</p>
            </div>
            <div className="bg-surface border border-app rounded-xl p-4">
              <p className="text-xs text-subtle">Search Results</p>
              <p className="text-2xl font-black">{filteredUsers.length}</p>
            </div>
            <div className="bg-surface border border-app rounded-xl p-4">
              <p className="text-xs text-subtle">Admin Accounts</p>
              <p className="text-2xl font-black">{data.totals.adminAccounts || 0}</p>
            </div>
          </section>

          <section className="bg-surface border border-app rounded-2xl p-4 md:p-5 space-y-3">
            <h2 className="font-black text-lg">Business Directory</h2>
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-app rounded-xl p-3">
                  <p className="font-semibold text-sm">{user.shopName || 'Unnamed Business'}</p>
                  <p className="text-xs text-subtle">{user.ownerName || '-'} | {user.email || '-'}</p>
                  <p className="text-xs mt-1">Category: <span className="font-semibold uppercase">{user.category || '-'}</span></p>
                  <p className="text-xs mt-1">
                    Active Plan: <span className="font-semibold">{formatPlanLabel(user.plan)}</span>
                    {' '}| Since: <span className="font-semibold">{formatDateTime(user.planAssignedAtMs)}</span>
                    {' '}| Days: <span className="font-semibold">{user.planActiveDays ?? '-'}</span>
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-subtle">Plan</span>
                    <select
                      value={user.plan || 'free'}
                      disabled={String(user.email || '').toLowerCase() === 'admin@dxtoolz.com'}
                      onChange={async (e) => {
                        const nextPlan = e.target.value as 'free' | 'pro' | 'business';
                        try {
                          await adminUpdateUserPlan(user.uid || user.id, nextPlan, user.email);
                          emitToast({ variant: 'success', message: `Plan changed to ${nextPlan}.` });
                          await load();
                        } catch (error: any) {
                          emitToast({ variant: 'error', message: error?.message || 'Failed to update plan.' });
                        }
                      }}
                      className="border border-app rounded-lg px-2 py-1 text-xs bg-transparent"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business+</option>
                    </select>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && <p className="text-sm text-subtle py-2">No matching users.</p>}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-surface border border-app rounded-2xl p-4 md:p-5 space-y-2">
              <h3 className="font-black">PaidInterestUser Queue</h3>
              <div className="max-h-[38vh] overflow-y-auto space-y-2">
                {(data.paidInterestUsers || []).map((entry) => (
                  <div key={String(entry.requestId || entry.id)} className="border border-app rounded-xl p-3">
                    <p className="font-semibold text-sm">{String(entry.businessName || entry.shopName || 'Unnamed Business')}</p>
                    <p className="text-xs text-subtle">{String(entry.ownerName || '-')} | {String(entry.email || '-')}</p>
                    <p className="text-xs mt-1">Phone: <span className="font-semibold">{String(entry.phoneNumber || '-')}</span></p>
                    <p className="text-xs mt-1">
                      Requested: <span className="font-semibold">{formatRequestedPlanLabel(entry.requestedPlan)}</span>
                      {' '}| Requested At: <span className="font-semibold">{formatDateTime(entry.createdAtMs)}</span>
                    </p>
                  </div>
                ))}
                {(data.paidInterestUsers || []).length === 0 && <p className="text-sm text-subtle">No paid interest requests yet.</p>}
              </div>
            </div>

            <div className="bg-surface border border-app rounded-2xl p-4 md:p-5 space-y-2">
              <h3 className="font-black">Paid Users Summary</h3>
              <div className="max-h-[38vh] overflow-y-auto space-y-2">
                {(data.paidUsersSummary || []).map((entry) => (
                  <div key={String(entry.uid || entry.id)} className="border border-app rounded-xl p-3">
                    <p className="font-semibold text-sm">{String(entry.shopName || entry.businessName || 'Unnamed Business')}</p>
                    <p className="text-xs text-subtle">{String(entry.ownerName || '-')} | {String(entry.email || '-')}</p>
                    <p className="text-xs mt-1">
                      Plan: <span className="font-semibold">{formatPlanLabel(String(entry.plan || 'free'))}</span>
                      {' '}| Active Days: <span className="font-semibold">{String(entry.planActiveDays ?? '-')}</span>
                    </p>
                    <p className="text-xs mt-1">
                      Activated At: <span className="font-semibold">{formatDateTime(entry.planAssignedAtMs)}</span>
                    </p>
                  </div>
                ))}
                {(data.paidUsersSummary || []).length === 0 && <p className="text-sm text-subtle">No paid users yet.</p>}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
