import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ROUTES } from '../utils/routes';
import { getPublicTheme, onPublicThemeChange } from '../utils/publicTheme';

const FEATURES = [
  'billing','inventory','ledger','ordering','reports','expiry',
  'appointments','ehr','kitchen','staff','repairTickets',
  'warranty','jobBooking','expenses'
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  const { isAuthenticated, onboardingCompleted, isAdmin } =
    useSelector((state: RootState) => state.config);

  const [publicThemeMode, setPublicThemeMode] = useState<'light' | 'dark'>(() => getPublicTheme());

  // smoother “data-like” values
  const [bars, setBars] = useState([35, 55, 42, 68, 50, 62, 45]);

  useEffect(() => onPublicThemeChange(setPublicThemeMode), []);

  useEffect(() => {
    if (isAuthenticated && (onboardingCompleted || isAdmin)) {
      navigate(ROUTES.userDashboard, { replace: true });
    }
  }, [isAuthenticated, onboardingCompleted, isAdmin]);

  // smoother SaaS-like animation (NOT random jitter)
  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev =>
        prev.map((v, i) => {
          const wave = Math.sin(Date.now() / 800 + i) * 4;
          const drift = Math.random() * 2 - 1;
          const next = v + wave * 0.3 + drift;

          return Math.max(25, Math.min(95, next));
        })
      );
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[80vh] overflow-hidden relative flex items-center justify-center">

      {/* 🔵 background glow */}
     

      <div className="w-full max-w-7xl px-5 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* LEFT */}
        <div className="text-center lg:text-left space-y-6 text-white">

          <p className="uppercase tracking-[0.3em] text-xs text-blue-200">
            Unified ERP Platform
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Your Entire Business.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
              One Intelligent System
            </span>
          </h1>

          <p className="text-sm md:text-lg text-blue-100 max-w-xl mx-auto lg:mx-0">
            Billing, inventory, healthcare, staff, reports : everything connected in real time.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            <button
              onClick={() => navigate(ROUTES.setup)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 font-semibold shadow-xl hover:scale-105 transition"
            >
              <Sparkles size={16} className="inline mr-2" />
              Start Free
            </button>

            <button
              onClick={() => navigate(ROUTES.admin)}
              className="px-6 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur"
            >
              Admin Login
            </button>
          </div>
        </div>

        {/* RIGHT - REALISTIC ANALYTICS CARD */}
        <div className="flex justify-center relative">

          <div className="w-[2600px] sm:w-[530px] md:w-[580px] h-[400px] md:h-[560px] relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">

            {/* GRID BACKGROUND */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '22px 22px'
              }}
            />

            {/* BASELINE */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-blue-400/40" />

            {/* BARS */}
            <div className="relative flex items-end justify-between h-full px-3 pb-3 gap-1">

              {bars.map((h, i) => (
                <div
                  key={i}
                  className="relative flex-1 rounded-t-md transition-all duration-700 ease-out"
                  style={{
                    height: `${h}%`,
                    background: 'linear-gradient(to top, #1e90ff, #38bdf8)',
                    boxShadow: '0 0 18px rgba(30,144,255,0.25)'
                  }}
                >
                  {/* TOP GLOW DOT */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-sky-300 rounded-full shadow-md" />
                </div>
              ))}

            </div>

            {/* LABEL */}
            <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] md:text-xs text-blue-200 p-5">
              Live Business Analytics
            </div>
          </div>

          {/* FEATURES FLOATING (desktop only) */}
          <div className="hidden md:block">
            {FEATURES.slice(0, 6).map((f, i) => (
              <div
                key={f}
                className="absolute text-[10px] px-2 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-blue-100"
                style={{
                  top: `${18 + Math.sin(i) * 50}%`,
                  left: `${8 + i * 12}%`
                }}
              >
                {f}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;