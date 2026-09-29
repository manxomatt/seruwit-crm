import React, { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTrans } from '@/hooks/useTrans';
import { DEFAULT_SITE_NAME } from '../constants';

interface Settings {
  'general.site_name'?: string;
  'site.logo'?: string;
  [key: string]: string | undefined;
}

interface NavbarProps {
  settings?: Settings;
  canLogin?: boolean;
  canRegister?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ settings, canLogin = true, canRegister = true }) => {
  const { t } = useTrans();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
  const siteLogo = settings?.['site.logo'];

  const featureItems = [
    {
      title: t('landing.nav.rental', undefined, 'Rental & Booking'),
      desc: 'Kalender reservasi, SPK digital & screening dokumen KTP/SIM',
      icon: 'directions_car',
      href: '#rental',
      tone: 'text-teal-700 bg-teal-50',
    },
    {
      title: t('landing.nav.fleet', undefined, 'Manajemen Armada'),
      desc: 'GPS radar live, pengingat STNK & performa driver',
      icon: 'explore',
      href: '#armada',
      tone: 'text-sky-700 bg-sky-50',
    },
    {
      title: t('landing.nav.accounting', undefined, 'Akuntansi & Finansial'),
      desc: 'Invoicing QRIS/VA, deposit aman & P&L per unit mobil',
      icon: 'account_balance_wallet',
      href: '#akuntansi',
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      title: t('landing.nav.ecosystem', undefined, 'Ekosistem Modul'),
      desc: 'Ekspansi logistik, POS kasir & gudang suku cadang',
      icon: 'hub',
      href: '#ekosistem',
      tone: 'text-purple-700 bg-purple-50',
    },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFeaturesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          
          {/* Brand Logo & Name - Clean & Uncluttered */}
          <a href="/" className="flex min-w-0 items-center gap-2.5 group">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 text-white shadow-sm shadow-teal-600/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </span>
            )}
            <span className="truncate font-heading text-lg font-black tracking-tight text-slate-900">
              {siteName}
            </span>
          </a>

          {/* Clean Desktop Navigation with Features Dropdown */}
          <nav className="hidden items-center gap-8 md:flex">
            {/* Features Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                onMouseEnter={() => setIsFeaturesOpen(true)}
                className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
                  isFeaturesOpen ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-expanded={isFeaturesOpen}
              >
                <span>{t('landing.nav.features', undefined, 'Fitur')}</span>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                    isFeaturesOpen ? 'rotate-180 text-teal-700' : 'text-slate-400'
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Flyout Mega Menu */}
              {isFeaturesOpen && (
                <div
                  onMouseLeave={() => setIsFeaturesOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xl shadow-slate-900/10 transition-all duration-200"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t('landing.nav.solutions', undefined, 'Fitur Utama')}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {featureItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsFeaturesOpen(false)}
                        className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                          <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Links */}
            <a
              href="#cara-kerja"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              {t('landing.nav.benefits', undefined, 'Cara Kerja')}
            </a>

            <a
              href="#faq"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              {t('landing.nav.faq', undefined, 'FAQ')}
            </a>
          </nav>

          {/* Action Area: Language Switcher, Login & Compact CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <LanguageSwitcher
              compact
              className="hidden sm:inline-flex bg-slate-100/80 [&_button]:text-slate-500 [&_button.bg-white]:text-teal-800"
            />

            {canLogin && (
              <Link
                href={route('login')}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 px-2 py-1.5"
                prefetch
              >
                {t('landing.nav.login', undefined, 'Masuk')}
              </Link>
            )}

            {canRegister && (
              <Link
                href={route('register')}
                className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-teal-800 transition active:scale-95"
                prefetch
              >
                <span>{t('landing.nav.cta', undefined, 'Mulai Gratis')}</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 md:hidden hover:bg-slate-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={t('landing.nav.menu_toggle')}
              aria-expanded={isMenuOpen}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="border-b border-slate-100 bg-white px-4 pb-5 pt-3 md:hidden shadow-lg space-y-3">
          <div className="space-y-1">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('landing.nav.features', undefined, 'Fitur')}
            </p>
            {featureItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px] text-teal-700">{item.icon}</span>
                <span>{item.title}</span>
              </a>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1">
            <a
              href="#cara-kerja"
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('landing.nav.benefits', undefined, 'Cara Kerja')}
            </a>
            <a
              href="#faq"
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('landing.nav.faq', undefined, 'FAQ')}
            </a>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('landing.nav.language', undefined, 'Bahasa')}</span>
            <LanguageSwitcher compact className="bg-slate-100 [&_button.bg-white]:text-teal-800" />
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
