import React, { useMemo, useState } from 'react';
import Pricing, { PlanId } from '../components/Pricing';
import { BarChart3, Crown, LogOut, Palette } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setPhoneNumber, setPlan, setThemeMode, setThemePalette, signOutUser } from '../features/configSlice';
import { PALETTES } from '../utils/themes';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, savePaidInterestUser, savePlanAndPhone, signOutFirebase } from '../utils/firebase';
import { ROUTES } from '../utils/routes';
import { emitToast } from '../utils/toast';
import { isPaidPlan, normalizePlan, UserPlan } from '../utils/plans';
import { handlePlanAwareLogout } from '../utils/dataAccess';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    shopName,
    ownerName,
    phoneNumber,
    authEmail,
    selectedProfessionId,
    plan,
    themeMode,
    themePalette,
    isAdmin,
    authUid,
  } = useSelector((state: RootState) => state.config);
  const appState = useSelector((state: RootState) => state);

  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [dismissCompletionHint, setDismissCompletionHint] = useState(false);

  const completionPercent = useMemo(() => {
    const checks = [
      Boolean(ownerName?.trim()),
      Boolean(shopName?.trim()),
      Boolean(authEmail?.trim()),
      Boolean(selectedProfessionId?.trim()),
      Boolean(phoneNumber?.trim()),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [ownerName, shopName, authEmail, selectedProfessionId, phoneNumber]);

  const activePlanLabel = useMemo(() => {
    const normalized = normalizePlan(plan);
    if (normalized === 'pro') return 'Pro';
    if (normalized === 'business') return 'Business+';
    return 'Starter';
  }, [plan]);

  const persistPlanSelection = async (nextPlan: UserPlan, nextPhone?: string) => {
    if (!authUid) throw new Error('Please login again.');
    await savePlanAndPhone(authUid, nextPlan, nextPhone || phoneNumber || undefined);
    if (nextPhone !== undefined) dispatch(setPhoneNumber(nextPhone));
    dispatch(setPlan(nextPlan));
  };

  const submitPaidInterest = async (requestedPlan: 'pro' | 'business', submittedPhone?: string) => {
    if (!authUid) throw new Error('Please login again.');
    const finalPhone = String(submittedPhone || phoneNumber || '').trim();
    if (!finalPhone) throw new Error('Update phone first');
    const owner = String(ownerName || '').trim() || 'Unknown';
    const business = String(shopName || '').trim() || 'Unknown';
    const email = String(authEmail || '').trim().toLowerCase() || 'unknown@example.com';

    dispatch(setPhoneNumber(finalPhone));
    dispatch(setPlan('free'));

    await savePaidInterestUser({
      uid: authUid,
      ownerName: owner,
      phoneNumber: finalPhone,
      businessName: business,
      email,
      requestedPlan: requestedPlan === 'business' ? 'business_plus' : 'pro',
    });
  };

  const handlePlanSelect = async (selected: PlanId) => {
    const nextPlan = normalizePlan(selected);
    const currentPlan = normalizePlan(plan);
    if (!authUid) {
      emitToast({ variant: 'error', message: 'Please login again.' });
      return;
    }
    if (nextPlan === currentPlan) {
      emitToast({ variant: 'info', message: 'Already active' });
      return;
    }

    if (!isAdmin && nextPlan !== 'free') {
      setSubmittingPlan(true);
      try {
        const remoteProfile = await getUserProfile(authUid);
        const phoneFromProfile = String(remoteProfile?.phoneNumber || '').trim();
        const finalPhone = phoneFromProfile || phoneNumber.trim();
        if (!finalPhone) {
          emitToast({ variant: 'info', message: 'Update phone first' });
          return;
        }
        await submitPaidInterest(nextPlan, finalPhone);
        emitToast({ variant: 'info', message: 'Request sent' });
      } catch (error: any) {
        const message = String(error?.message || '');
        if (message.toLowerCase().includes('already requested')) {
          emitToast({ variant: 'info', message: 'Already requested' });
        } else {
          emitToast({ variant: 'error', message: 'Request failed' });
        }
      } finally {
        setSubmittingPlan(false);
      }
      return;
    }

    if (nextPlan === 'free') {
      setSubmittingPlan(true);
      try {
        await persistPlanSelection('free');
        emitToast({ variant: 'success', message: 'Free plan selected.' });
      } catch (error: any) {
        emitToast({ variant: 'error', message: error?.message || 'Failed to save plan.' });
      } finally {
        setSubmittingPlan(false);
      }
      return;
    }

    setSubmittingPlan(true);
    try {
      await persistPlanSelection(nextPlan);
      emitToast({ variant: 'success', message: `${nextPlan === 'pro' ? 'Pro' : 'Business+'} plan selected.` });
    } catch (error: any) {
      emitToast({ variant: 'error', message: error?.message || 'Failed to save plan.' });
    } finally {
      setSubmittingPlan(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {completionPercent < 100 && !dismissCompletionHint && (
        <section className="bg-[#fffaf0] border border-[#ffd89b] rounded-2xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#a16207]">Profile Complete Now</p>
              <p className="font-bold text-[#7c4a03] mt-1">Profile completion: {completionPercent}%</p>
            </div>
            <button
              onClick={() => setDismissCompletionHint(true)}
              className="text-xs border border-[#ffd89b] rounded-lg px-2 py-1 text-[#7c4a03]"
            >
              Later
            </button>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#ffe8be] overflow-hidden">
            <div className="h-full bg-[#f59e0b] transition-all duration-300" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="text-xs text-[#92400e] mt-2">Complete profile details for smoother cross-device sync and plan upgrades.</p>
        </section>
      )}

      <section className="bg-surface border border-app rounded-2xl p-6">
        <h1 className="text-3xl font-black">Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
          <div className="rounded-xl border border-app p-4">
            <p className="text-subtle text-xs">Name</p>
            <p className="font-semibold">{ownerName || '-'}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-subtle text-xs">Business</p>
            <p className="font-semibold">{shopName || '-'}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-subtle text-xs">Email</p>
            <p className="font-semibold">{authEmail || '-'}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-subtle text-xs">Category</p>
            <p className="font-semibold uppercase">{selectedProfessionId || '-'}</p>
          </div>
          <div className="rounded-xl border border-app p-4">
            <p className="text-subtle text-xs">Phone</p>
            <p className="font-semibold">{phoneNumber || '-'}</p>
          </div>
        </div>

      </section>

      <section className="bg-surface border border-app rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Palette size={18} />
          <h2 className="font-black text-xl">Appearance</h2>
        </div>
        <p className="text-sm text-subtle mt-1">Choose mode and palette for your dashboard workspace.</p>

        <div className="mt-4 inline-flex rounded-xl border border-app p-1 bg-app/60">
          <button
            onClick={() => { dispatch(setThemeMode('light')); emitToast({ variant: 'success', message: 'Theme switched to light.' }); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${themeMode === 'light' ? 'bg-primary-app text-white' : 'text-subtle'}`}
          >
            Light
          </button>
          <button
            onClick={() => { dispatch(setThemeMode('dark')); emitToast({ variant: 'success', message: 'Theme switched to dark.' }); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${themeMode === 'dark' ? 'bg-primary-app text-white' : 'text-subtle'}`}
          >
            Dark
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {PALETTES.map((palette) => (
            <button
              key={palette.name}
              onClick={() => { dispatch(setThemePalette(palette.name)); emitToast({ variant: 'success', message: `Palette changed to ${palette.name}.` }); }}
              className={`rounded-xl border p-3 text-left ${themePalette === palette.name ? 'border-[var(--primary)] bg-[color:var(--primary)]/8' : 'border-app'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{palette.name}</p>
                {themePalette === palette.name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-app text-white">Selected</span>}
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className="h-5 w-5 rounded-full border border-app" style={{ background: palette.primary }} />
                <span className="h-5 w-5 rounded-full border border-app" style={{ background: palette.lightTheme.background }} />
                <span className="h-5 w-5 rounded-full border border-app" style={{ background: palette.darkTheme.background }} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-app rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Crown size={18} />
          <h2 className="font-black text-xl">Plans</h2>
        </div>
        <p className="text-sm text-subtle mt-2">
          Active plan right now: <span className="font-semibold text-app">{activePlanLabel}</span>
        </p>
        <div className="mt-4">
          <Pricing
            current={normalizePlan(plan)}
            onSelect={handlePlanSelect}
          />
          {!isAdmin && (
            <p className="text-xs text-subtle mt-2">
              For users, paid plans are request-only. Click Pro or Business+ to submit your details.
            </p>
          )}
          {submittingPlan && <p className="text-xs text-subtle mt-2">Saving plan...</p>}
        </div>
      </section>

      {isAdmin && (
        <section className="bg-surface border border-app rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-black text-xl">Admin Controls</h2>
              <p className="text-sm text-subtle">Open centralized analytics for all users.</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.adminAnalytics)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-app text-white font-semibold"
            >
              <BarChart3 size={15} /> Analytics
            </button>
          </div>
        </section>
      )}

      <section className="bg-surface border border-[var(--danger)]/50 rounded-2xl p-6">
        <h2 className="font-black mb-2">Account Actions</h2>
        <p className="text-sm text-subtle mb-4">Logout returns to home. Login again to continue.</p>
        <button
          onClick={async () => {
            try {
              const authEmailCopy = authEmail;
              if (appState.config.authUid) {
                const storageMode = appState.config.isAdmin
                  ? 'persistent'
                  : (isPaidPlan(appState.config.plan) ? 'hybrid' : 'temporary');
                await handlePlanAwareLogout({
                  uid: appState.config.authUid,
                  storageMode,
                  snapshot: {
                    config: appState.config,
                    inventory: appState.inventory,
                    repairs: appState.repairs,
                    pos: appState.pos,
                    business: appState.business,
                    finance: appState.finance,
                    customers: appState.customers,
                  },
                  isAdmin: appState.config.isAdmin,
                });
              }
              await signOutFirebase();
              dispatch(signOutUser());
              navigate(ROUTES.home);
              emitToast({ variant: 'success', message: `Logged out. Local data cleared${authEmailCopy ? ` for ${authEmailCopy}` : ''}.` });
            } catch {
              emitToast({ variant: 'error', message: 'Logout failed. Try again.' });
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-[color:var(--danger)] border-2 border-[var(--danger)]"
        >
          <LogOut size={16} /> Logout
        </button>
      </section>

    </div>
  );
};

export default Profile;
