import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
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

const steps = ['Google Login', 'Business', 'Category', 'Phone'];

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

  const [step, setStep] = useState(1);
  const [shop, setShop] = useState(shopName);
  const [owner, setOwner] = useState(ownerName);
  const [phone, setPhone] = useState(phoneNumber);
  const [selectedCategory, setSelectedCategory] = useState(selectedProfessionId || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingUserNote, setExistingUserNote] = useState('');

  const progress = useMemo(() => `${step}/${steps.length}`, [step]);

  if (authResolved && isAuthenticated && onboardingCompleted) {
    return <Navigate to={ROUTES.userDashboard} replace />;
  }

  const canProceed = () => {
    if (step === 1) return isAuthenticated;
    if (step === 2) return Boolean(shop.trim() && owner.trim());
    if (step === 3) return Boolean(selectedCategory || selectedProfessionId);
    if (step === 4) return true;
    return false;
  };

  const saveOnboardingProfile = async () => {
    if (!authUid) throw new Error('Authentication not available.');
    const role: UserRole = deriveRoleFromEmail(authEmail);
    const defaultCategory = PROFESSIONS[0]?.id || 'retail';
    const finalCategory = selectedCategory || selectedProfessionId || defaultCategory;

    const finalPlan: UserPlan = role === 'admin' ? 'business' : 'free';
    const safePhone = phone.trim();
    dispatch(setShopName(shop.trim()));
    dispatch(setOwnerName(owner.trim()));
    dispatch(setPhoneNumber(safePhone));
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
        ownerName: owner.trim(),
        shopName: shop.trim(),
        selectedProfessionId: finalCategory,
        plan: finalPlan,
        phoneNumber: safePhone,
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

  const moveNext = async () => {
    setError('');
    if (!canProceed()) {
      setError('Please complete this step before continuing.');
      emitToast({ variant: 'error', message: 'Please complete current step first.' });
      return;
    }
    if (step < steps.length) {
      setStep((s) => s + 1);
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
    <div className="max-w-4xl mx-auto space-y-5 pb-20">
      <section className="bg-surface border border-app rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-subtle">Setup Flow</p>
            <h1 className="text-3xl font-black mt-1">Create your workspace</h1>
          </div>
          <span className="text-sm font-semibold text-subtle">{progress}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {steps.map((item, idx) => (
            <div key={item} className={`rounded-lg px-2 sm:px-3 py-2 text-[11px] sm:text-xs text-center border min-h-[46px] flex items-center justify-center leading-tight ${step >= idx + 1 ? 'border-[var(--primary)] text-primary-app bg-[color:var(--primary)]/10' : 'border-app text-subtle'}`}>
              {idx + 1}. {item}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-app rounded-2xl p-6 min-h-[340px]">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-black text-xl">Step 1: Continue with Google</h2>
            <p className="text-sm text-subtle">Use one secure sign-in flow. New users continue setup, existing users go straight to dashboard.</p>
            {!isAuthenticated ? (
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
            ) : (
              <div className="inline-flex items-center gap-2 text-[color:var(--success)] text-sm font-semibold">
                <CheckCircle2 size={16} /> Logged in successfully
              </div>
            )}
            {existingUserNote && <div className="text-sm border border-app rounded-lg p-3 bg-app">{existingUserNote}</div>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-black text-xl">Step 2: Business Details</h2>
            <p className="text-sm text-subtle">Tell us who owns this workspace.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Business name" className="border border-app bg-transparent rounded-lg px-3 py-2" />
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner name" className="border border-app bg-transparent rounded-lg px-3 py-2" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-black text-xl">Step 3: Select Category</h2>
            <p className="text-sm text-subtle">Your category configures your default toolkit.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PROFESSIONS.map((profession) => (
                <button
                  key={profession.id}
                  onClick={() => setSelectedCategory(profession.id)}
                  className={`rounded-xl border p-4 text-left ${selectedCategory === profession.id ? 'border-[var(--primary)] bg-[color:var(--primary)]/10' : 'border-app'}`}
                >
                  <p className="font-bold">{profession.name}</p>
                  <p className="text-xs text-subtle mt-2">{profession.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-black text-xl">Step 4: Phone Number</h2>
            <p className="text-sm text-subtle">Phone number is optional. You can add or update it later in Profile.</p>
            <input
  type="tel"
  inputMode="numeric"
  maxLength={10}
  value={phone}
  onChange={(e) => {
    const onlyNums = e.target.value.replace(/\D/g, ""); // remove non-digits
    setPhone(onlyNums.slice(0, 10)); // limit to 10 digits
  }}
  placeholder="Phone number"
  className="border border-app bg-transparent rounded-lg px-3 py-2 w-full max-w-md"
/>

          </div>
        )}
      </section>

      {error && (
        <div className="bg-[color:var(--danger)]/10 border border-[var(--danger)] rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 z-20 bg-[color:var(--background)]/95 backdrop-blur border border-app rounded-2xl p-3 flex gap-2">
        {step > 1 && (
          <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2 border border-app rounded-lg inline-flex items-center gap-1">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        <button
          onClick={moveNext}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary-app text-white font-semibold inline-flex items-center gap-2 disabled:opacity-65"
        >
          {saving ? 'Saving...' : (step < steps.length ? 'Next Step' : 'Go to Dashboard')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Setup;
