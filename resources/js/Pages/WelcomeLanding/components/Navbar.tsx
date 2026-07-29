import React, { useState } from 'react';
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

  const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
  const siteLogo = settings?.['site.logo'];

  const navLinks = [
    { label: t('landing.nav.features'), href: '#modul' },
    { label: t('landing.nav.benefits'), href: '#cara-kerja' },
    { label: t('landing.nav.contact'), href: '#kontak' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <a href="/" className="flex min-w-0 items-center gap-2.5">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-sm shadow-teal-600/20">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </span>
            )}
            <span className="truncate font-display text-lg font-bold tracking-tight text-slate-900">
              {siteName}
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher
              compact
              className="hidden bg-slate-100 sm:inline-flex [&_button]:text-slate-500 [&_button.bg-white]:text-teal-800"
            />
            {canLogin && (
              <Link
                href={route('login')}
                className="hidden text-sm font-semibold text-slate-700 transition-colors hover:text-teal-700 sm:inline"
                prefetch
              >
                {t('landing.nav.login')}
              </Link>
            )}
            {canRegister && (
              <Link
                href={route('register')}
                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800 sm:px-5"
                prefetch
              >
                {t('landing.nav.cta')}
              </Link>
            )}
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 md:hidden"
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

      {isMenuOpen && (
        <div className="space-y-1 border-b border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-800"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {canLogin && (
            <Link
              href={route('login')}
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-800"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('landing.nav.login')}
            </Link>
          )}
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-slate-500">{t('landing.nav.language')}</span>
            <LanguageSwitcher compact className="bg-slate-100 [&_button.bg-white]:text-teal-800" />
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
