import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Megaphone, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { TOOL_DEFINITIONS } from '../utils/catalog';
import { ROUTES } from '../utils/routes';
import Modal from '../components/Modal';
import { getPublicTheme, onPublicThemeChange } from '../utils/publicTheme';

const heroKeywords = [
  'Simple ERP for Indian small businesses',
  'Run your entire business from one app',
  'Everything your shop needs, in one place',
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [openToolId, setOpenToolId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [alphaIndex, setAlphaIndex] = useState(0);
  const [brandCount, setBrandCount] = useState(0);
  const [casinoText, setCasinoText] = useState('DHANDAX');
  const [publicThemeMode, setPublicThemeMode] = useState<'light' | 'dark'>(() => getPublicTheme());
  const { isAuthenticated, onboardingCompleted, isAdmin } = useSelector((state: RootState) => state.config);

  const waveRefOne = useRef<HTMLDivElement | null>(null);
  const waveRefTwo = useRef<HTMLDivElement | null>(null);
  const floatBlobRef = useRef<HTMLDivElement | null>(null);

  const introBrand = 'DhandaX';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomAlpha = () => alphabet[Math.floor(Math.random() * alphabet.length)];

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      if (waveRefOne.current) waveRefOne.current.style.transform = `translate3d(0,${y * 0.08}px,0)`;
      if (waveRefTwo.current) waveRefTwo.current.style.transform = `translate3d(0,${y * 0.14}px,0)`;
      if (floatBlobRef.current) floatBlobRef.current.style.transform = `translate3d(0,${y * 0.1}px,0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let letterIndex = 0;
    let brandIndex = 0;
    setCasinoText('DHANDAX');

    const alphaTimer = window.setInterval(() => {
      letterIndex = Math.min(alphabet.length - 1, letterIndex + 1);
      setAlphaIndex(letterIndex);
      if (letterIndex >= alphabet.length - 1) window.clearInterval(alphaTimer);
    }, 45);

    const brandTimer = window.setInterval(() => {
      brandIndex = Math.min(introBrand.length, brandIndex + 1);
      setBrandCount(brandIndex);
      const next = introBrand
        .split('')
        .map((char, index) => (index < brandIndex ? char : randomAlpha()))
        .join('');
      setCasinoText(next);
      if (brandIndex >= introBrand.length) window.clearInterval(brandTimer);
    }, 95);

    const hideTimer = window.setTimeout(() => setShowIntro(false), 2400);

    return () => {
      window.clearInterval(alphaTimer);
      window.clearInterval(brandTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (showIntro) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow || '';
    }
    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [showIntro]);

  useEffect(() => onPublicThemeChange((mode) => setPublicThemeMode(mode)), []);

  useEffect(() => {
    if (isAuthenticated && (onboardingCompleted || isAdmin)) {
      navigate(ROUTES.userDashboard, { replace: true });
    }
  }, [navigate, isAuthenticated, onboardingCompleted, isAdmin]);

  const selectedTool = useMemo(() => TOOL_DEFINITIONS.find((item) => item.id === openToolId), [openToolId]);

  return (
    <>
      {showIntro && typeof document !== 'undefined' && createPortal(
        <div className="landing-intro fixed inset-0 z-[1000] flex items-center justify-center px-4">
          <div className="text-center flex flex-col items-center justify-center">
            <p className="text-[11px] tracking-[0.32em] text-[#1e5b9a] font-semibold">WELCOME TO</p>
            <h1 className="landing-brand mt-3">{introBrand.slice(0, brandCount)}</h1>
          </div>
        </div>,
        document.body,
      )}

      <div className={`landing-shell max-w-7xl mx-auto px-0 sm:px-4 md:px-5 space-y-10 pb-20 overflow-x-hidden ${publicThemeMode === 'dark' ? 'home-dark' : ''}`}>
        <div className="landing-water-layer pointer-events-none" ref={waveRefOne} />
        <div className="landing-water-layer-two pointer-events-none" ref={waveRefTwo} />
        <div className="landing-float-blob pointer-events-none" ref={floatBlobRef} />

        <section className="relative overflow-hidden">
          <div className="hero-content relative px-3 py-4 sm:px-8 sm:py-10 md:px-12 md:py-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-5 sm:gap-7 items-center">
          <div className="space-y-5 animate-rise">
            <p className="home-kicker inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#3d608d]">Simple ERP Stack</p>
            <h1 className="home-hero-title text-3xl sm:text-4xl md:text-6xl font-black leading-tight text-[#0f2d66]">
              Run Your Entire Business
              <br />
              From One App
            </h1>
            <p className="home-hero-sub text-base md:text-xl font-semibold text-[#1e90ff]">Billing, inventory, reports...</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate(ROUTES.setup)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1e90ff] text-white font-semibold shadow-[0_10px_30px_rgba(30,144,255,0.35)] hover:translate-y-[-1px] transition">
                <Sparkles size={16} /> Start Free
              </button>
              <button onClick={() => navigate(ROUTES.admin)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#bedcff] text-[#0f2d66] font-semibold bg-white/85">
                Admin Login
              </button>
            </div>
            <p className="home-muted text-xs md:text-sm text-[#385173] font-semibold">No credit card required</p>
          </div>

          <div className="home-why-wrap rounded-none border-0 bg-transparent p-0 sm:p-5 md:rounded-2xl md:border md:border-[#cde4ff] md:bg-white/95 md:p-5 animate-rise-delayed space-y-3">
            <p className="home-kicker text-xs uppercase tracking-[0.2em] text-[#1e90ff] font-semibold">Why DX Tools</p>
            {heroKeywords.map((line) => (
              <div key={line} className="home-chip rounded-xl border border-[#d8e9ff] bg-[#f7fbff] px-3 py-2 text-sm md:text-base text-[#0f2d66] font-semibold leading-snug">
                {line}
              </div>
            ))}
            <div className="home-chip home-muted rounded-xl border border-[#d8e9ff] bg-white px-3 py-2 text-sm text-[#385173]">
              Everything your day-to-day operations need in one clean workspace.
            </div>
          </div>
          </div>
        </section>

        <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="home-section-title text-2xl font-black text-[#0f2d66]">Available Tools</h3>
          <span className="home-muted text-xs text-[#4e6c93]">Tap to preview module</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TOOL_DEFINITIONS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setOpenToolId(tool.id)}
              className="home-tool-card rounded-xl border border-[#cde4ff] bg-white p-4 text-left hover:border-[#1e90ff] hover:bg-[#f4f9ff] transition-all"
            >
              <p className="home-muted text-xs text-[#4e6c93]">{tool.category}</p>
              <p className="home-tool-title font-bold mt-1 text-[#0f2d66]">{tool.label}</p>
              <p className="home-muted text-xs text-[#4e6c93] mt-1">{tool.description}</p>
            </button>
          ))}
        </div>
        </section>

        <section className="home-marketing-card rounded-3xl border border-[#cde4ff] bg-white/92 backdrop-blur-[2px] p-6 md:p-8 shadow-[0_16px_45px_rgba(30,144,255,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="home-kicker text-xs uppercase tracking-[0.2em] text-[#1e90ff] font-semibold">Marketing Service</p>
            <h3 className="home-section-title text-2xl md:text-3xl font-black text-[#0f2d66] mt-1">Open Marketing Tools</h3>
            <p className="home-muted text-sm md:text-base text-[#385173] mt-2">
              Use dedicated marketing tools to improve online visibility and grow your customer base.
            </p>
          </div>
          <button
            onClick={() => {
              window.location.href = 'https://google.com';
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1e90ff] text-white font-semibold shadow-[0_10px_25px_rgba(30,144,255,0.3)]"
          >
            <Megaphone size={16} /> Open Marketing Tools
          </button>
        </div>
        </section>

        {openToolId && selectedTool && (
          <Modal
            isOpen={Boolean(openToolId && selectedTool)}
            onClose={() => setOpenToolId(null)}
            title="Tool Preview"
            maxWidth="34rem"
            closeOnBackdrop
            panelClassName="home-preview-modal"
          >
            <div className="space-y-3">
              <div>
                <p className="home-preview-category text-xs text-[#4e6c93]">{selectedTool.category}</p>
                <h4 className="home-preview-title text-xl font-black text-[#0f2d66]">{selectedTool.label}</h4>
              </div>
              <p className="home-preview-description text-sm text-[#385173] mt-3">{selectedTool.description}</p>
              <button onClick={() => navigate(ROUTES.setup)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e90ff] text-white text-sm font-semibold">
                Continue Setup <ArrowRight size={14} />
              </button>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

export default Home;
