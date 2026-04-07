import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';

export type PlanId = 'free' | 'pro' | 'business';
type PlanFeature = { name: string; available: boolean };
type PlanConfig = {
  id: PlanId;
  name: string;
  price: string;
  priceStrike?: string;
  billing: string;
  billingStrike?: string;
  bestFor: string;
  features: PlanFeature[];
};

const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 'Rs 0',
    billing: 'Forever Free',
    bestFor: 'Single-device small businesses',
    features: [
      { name: 'Login with Google', available: true },
      { name: 'Choose 1 business type (Kirana, Clinic, Cafe, etc.)', available: true },
      { name: 'Billing / POS', available: true },
      { name: 'Inventory management', available: true },
      { name: 'Customer credit & ledger', available: true },
      { name: 'Expenses tracking', available: true },
      { name: 'Daily reports', available: true },
      { name: 'Task & checklist', available: true },
      { name: 'Appointments / orders / tickets (as per business)', available: true },
      { name: 'Theme & color personalization', available: true },
      { name: '*Data lost on logout / reinstall', available: true },

      { name: 'Monthly summary & trends', available: false },
      { name: 'Data safety if phone is lost', available: false },
      { name: 'Use app on another device', available: false },
      { name: 'Automatic data backup', available: false },
      { name: 'Restore data after reinstall', available: false },
      { name: 'Add extra tools beyond preset', available: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceStrike: 'Rs 329 / month',
    price: 'Rs 249 / month',
    billingStrike: 'Rs 3,299 / year',
    billing: 'Rs 2,499 / year',
    bestFor: 'Serious business owners',
    features: [
      { name: 'Login with Google', available: true },
      { name: 'Choose 1 business type (Kirana, Clinic, Cafe, etc.)', available: true },
      { name: 'Billing / POS', available: true },
      { name: 'Inventory management', available: true },
      { name: 'Customer credit & ledger', available: true },
      { name: 'Expenses tracking', available: true },
      { name: 'Daily reports', available: true },
      { name: 'Task & checklist', available: true },
      { name: 'Appointments / orders / tickets (as per business)', available: true },
      { name: 'Theme & color personalization', available: true },
      { name: 'Monthly summary & trends', available: true },
      { name: 'Data safety if phone is lost', available: true },
      { name: 'Use app on another device (up to 2)', available: true },
      { name: 'Automatic data backup', available: true },
      { name: 'Restore data after reinstall', available: true },
      { name: 'Add extra tools beyond preset', available: true },
    ],
  },
  {
    id: 'business',
    name: 'Business+',
    priceStrike: 'Rs 649 / month',
    price: 'Rs 499 / month',
    billingStrike: 'Rs 6,499 / year',
    billing: 'Rs 4,999 / year',
    bestFor: 'Growing businesses & teams',
    features: [
      { name: 'Login with Google', available: true },
      { name: 'Choose 1 business type (Kirana, Clinic, Cafe, etc.)', available: true },
      { name: 'Billing / POS', available: true },
      { name: 'Inventory management', available: true },
      { name: 'Customer credit & ledger', available: true },
      { name: 'Expenses tracking', available: true },
      { name: 'Daily reports', available: true },
      { name: 'Task & checklist', available: true },
      { name: 'Appointments / orders / tickets (as per business)', available: true },
      { name: 'Theme & color personalization', available: true },
      { name: 'Monthly summary & trends', available: true },
      { name: 'Data safety if phone is lost', available: true },
      { name: 'Use app on multiple devices (up to 5)', available: true },
      { name: 'Automatic data backup', available: true },
      { name: 'Restore data after reinstall', available: true },
      { name: 'Add extra tools beyond preset', available: true },
    ],
  },
];

const cardTone = (id: PlanId) => {
  if (id === 'pro') return 'border-[color:var(--primary)]/40 bg-[color:var(--primary)]/5';
  if (id === 'business') return 'border-app bg-app/60';
  return 'border-app bg-surface';
};

const Pricing: React.FC<{ current?: 'free' | 'pro' | 'business' | null; onSelect?: (plan: PlanId) => void }> = ({
  current = null,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState<PlanId | null>('free');

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-2xl font-black">Plans & Pricing</h3>
        <span className="text-xs text-subtle inline-flex items-center gap-1">
          <Sparkles size={13} /> Tap any plan to view full benefits
        </span>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isOpen = expanded === plan.id;
          const isCurrent = current === plan.id;
          return (
            <article key={plan.id} className={`rounded-2xl border p-4 md:p-5 ${cardTone(plan.id)} smooth-transition`}>
              <button
                onClick={() => setExpanded((prev) => (prev === plan.id ? null : plan.id))}
                className="w-full text-left flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-subtle">{plan.name}</p>
                  {plan.priceStrike && <p className="text-sm text-subtle line-through mt-1">{plan.priceStrike}</p>}
                  <p className="text-2xl md:text-3xl font-black mt-1">{plan.price}</p>
                  <p className="text-xs text-subtle mt-1">
                    {plan.billingStrike && <span className="line-through mr-2">{plan.billingStrike}</span>}
                    <span>{plan.billing}</span>
                  </p>
                  <p className="text-sm mt-1">Best for: <span className="font-semibold">{plan.bestFor}</span></p>
                </div>
                <div className="mt-1">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
              </button>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-app space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.features.map((feature) => (
                      <div key={feature.name} className={`rounded-lg border px-3 py-2 text-sm flex items-start gap-2 ${feature.available ? 'border-app' : 'border-app/60 opacity-70'}`}>
                        <span className="mt-0.5">
                          {feature.available ? <Check size={14} className="text-[color:var(--success)]" /> : <X size={14} className="text-[color:var(--danger)]" />}
                        </span>
                        <span>{feature.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onSelect?.(plan.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold ${isCurrent ? 'bg-black text-white' : 'bg-primary-app text-white'}`}
                    >
                      {isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Pricing;
