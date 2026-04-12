import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import {
  applyRemoteProfile,
  completeOnboarding,
  hydrateConfigData,
  markAuthenticated,
  setOwnerName,
  setPhoneNumber,
  setPlan,
  setProfession,
  setShopName,
} from '../features/configSlice';
import { PROFESSIONS } from '../utils/catalog';
import { createInitialUserProfile, getUserProfile, signInWithGoogle } from '../utils/firebase';
import { ROUTES } from '../utils/routes';
import { emitToast } from '../utils/toast';
import { deriveRoleFromEmail, normalizePlan, UserPlan, UserRole } from '../utils/plans';
import { ensureUserAccountDocument } from '../utils/planEngine';

const Setup: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    onboardingCompleted,
    shopName,
    ownerName,
    phoneNumber,
    selectedProfessionId,
    authUid,
    authEmail,
    authDisplayName,
    authResolved,
  } = useSelector((state: RootState) => state.config);

  const [shop, setShop] = useState(shopName);
  const [owner, setOwner] = useState(ownerName);
  const [phone, setPhone] = useState(phoneNumber);
  const [selectedCategory, setSelectedCategory] = useState(selectedProfessionId || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingUserNote, setExistingUserNote] = useState('');

  if (authResolved && isAuthenticated && onboardingCompleted) {
    return <Navigate to={ROUTES.userDashboard} replace />;
  }

  const saveOnboardingProfile = async () => {
    if (!authUid) throw new Error('Authentication not available.');
    const role: UserRole = deriveRoleFromEmail(authEmail);
    const defaultCategory = PROFESSIONS[0]?.id || 'retail';
    const finalCategory = selectedCategory || selectedProfessionId || defaultCategory;

    const finalPlan: UserPlan = role === 'admin' ? 'business' : 'free';
    const fallbackShop = shop.trim() || 'Your Business';
    const fallbackOwner = owner.trim() || 'Owner';
    dispatch(setShopName(fallbackShop));
    dispatch(setOwnerName(fallbackOwner));
    dispatch(setPhoneNumber(''));
    dispatch(setProfession(finalCategory));
    dispatch(setPlan(finalPlan));
    dispatch(completeOnboarding());

    try {
      await ensureUserAccountDocument({
        uid: authUid,
        role,
        plan: finalPlan,
      });

      await createInitialUserProfile(authUid, {
        email: authEmail,
        displayName: authDisplayName,
        ownerName: fallbackOwner,
        shopName: fallbackShop,
        selectedProfessionId: finalCategory,
        plan: finalPlan,
        phoneNumber: '',
        role,
      });
    } catch (remoteError: any) {
      const message = String(remoteError?.message || remoteError || '').toLowerCase();
      if (message.includes('permission') || message.includes('insufficient')) {
        emitToast({ variant: 'info', message: 'Logged in locally. Cloud profile sync is blocked by Firestore rules.' });
        return;
      }
      if (message.includes('network') || message.includes('unavailable')) {
        emitToast({ variant: 'info', message: 'Logged in locally. Cloud sync will retry when network is stable.' });
        return;
      }
      throw remoteError;
    }
  };

  const handleCategoryPick = async (id: string) => {
    setSelectedCategory(id);
    if (!isAuthenticated) {
      emitToast({ variant: 'info', message: 'Sign in with Google to continue.' });
      return;
    }
    setSaving(true);
    try {
      await saveOnboardingProfile();
      emitToast({ variant: 'success', message: 'Setup completed. Redirecting to dashboard.' });
      navigate(ROUTES.userDashboard, { replace: true });
    } catch (e: any) {
      const message = e?.message || 'Failed to save profile.';
      setError(message);
      emitToast({ variant: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    setExistingUserNote('');
    try {
      const user = await signInWithGoogle();
      const role = deriveRoleFromEmail(user.email);
      dispatch(markAuthenticated({
        uid: user.uid,
        method: 'google',
        email: user.email,
        displayName: user.displayName,
        role,
        isAdmin: role === 'admin',
      }));

      const existing = await getUserProfile(user.uid);
      if (existing) {
        const existingRole: UserRole = existing.role === 'admin' ? 'admin' : role;
        const remotePlan = normalizePlan(existing.plan);
        const nextCategory = existing.selectedProfessionId || PROFESSIONS[0]?.id || 'retail';
        const nextShop = existing.shopName || '';
        const nextOwner = existing.ownerName || '';
        const nextPhone = existing.phoneNumber || '';

        // Existing Firestore profile found for this auth user: do not recreate profile.
        setSelectedCategory(nextCategory);
        setShop(nextShop);
        setOwner(nextOwner);
        setPhone(nextPhone);
        dispatch(
          applyRemoteProfile({
            shopName: nextShop || null,
            ownerName: nextOwner || null,
            phoneNumber: nextPhone || null,
            selectedProfessionId: nextCategory,
            role: existingRole,
            plan: remotePlan,
          }),
        );

        dispatch(
          hydrateConfigData({
            onboardingCompleted: true,
            plan: remotePlan,
            role: existingRole,
          }),
        );
        setExistingUserNote('Existing profile found. Redirecting to dashboard.');
        emitToast({ variant: 'success', message: 'Welcome back. Profile loaded from database.' });
        navigate(ROUTES.userDashboard, { replace: true });
        return;
      }

      emitToast({ variant: 'success', message: 'Google login successful. Continue setup.' });
    } catch (e: any) {
      const message = e?.message || 'Google login failed.';
      setError(message);
      emitToast({ variant: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      <section className="bg-surface border border-app rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-subtle">Setup</p>
            <h1 className="text-3xl font-black mt-1">Choose your category</h1>
          </div>
          {isAuthenticated && (
            <span className="inline-flex items-center gap-2 text-[color:var(--success)] text-sm font-semibold">
              <CheckCircle2 size={16} /> Logged in
            </span>
          )}
        </div>

        {!isAuthenticated && (
          <div className="space-y-4">
            <h2 className="font-black text-lg">Continue with Google</h2>
            <p className="text-sm text-subtle">One tap sign-in. Existing users are restored automatically.</p>
            <button
              disabled={loading}
              onClick={handleGoogleAuth}
              className="px-4 py-2.5 rounded-lg bg-primary-app text-white font-semibold disabled:opacity-60 inline-flex items-center gap-2"
            >
              <span className="h-5 w-5 rounded-full bg-white inline-flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 2.9 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.3-.2-2H12z" />
                </svg>
              </span>
              {loading ? 'Please wait...' : 'Continue with Google'}
            </button>
            {existingUserNote && <div className="text-sm border border-app rounded-lg p-3 bg-app">{existingUserNote}</div>}
          </div>
        )}

        {isAuthenticated && (
          <div className="space-y-4">
            <h2 className="font-black text-lg">Select your category</h2>
            <p className="text-sm text-subtle">Tap once to finish setup.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PROFESSIONS.map((profession) => (
                <button
                  key={profession.id}
                  onClick={() => handleCategoryPick(profession.id)}
                  disabled={saving}
                  className="rounded-xl border p-4 text-left border-app hover:border-[var(--primary)] hover:bg-[color:var(--primary)]/8 transition"
                >
                  <p className="font-bold">{profession.name}</p>
                  <p className="text-xs text-subtle mt-2">{profession.description}</p>
                </button>
              ))}
            </div>
            {saving && <p className="text-xs text-subtle">Finishing setup...</p>}
          </div>
        )}
      </section>

      {error && (
        <div className="bg-[color:var(--danger)]/10 border border-[var(--danger)] rounded-xl p-3 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default Setup;
