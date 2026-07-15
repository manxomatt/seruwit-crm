import React, { useState } from 'react';

interface Settings {
  'general.site_name'?: string;
  'site.logo'?: string;
  [key: string]: string | undefined;
}

interface NavbarProps {
  settings?: Settings;
}

const navLinks = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Keunggulan', href: '#keunggulan' },
  { label: 'Kontak', href: '#kontak' },
];

const Navbar: React.FC<NavbarProps> = ({ settings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const siteName = settings?.['general.site_name'] || 'Seruwit CRM';
  const siteLogo = settings?.['site.logo'];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
                </svg>
              </span>
            )}
            <span className="text-lg font-bold tracking-tight text-slate-900">{siteName}</span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-500"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-sky-500 sm:block"
            >
              Masuk
            </a>
            <a
              href="/register"
              className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition-colors hover:bg-sky-600"
            >
              Coba Gratis
            </a>
            <button
              className="p-2 text-slate-600 md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Buka menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
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
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/login"
            className="block rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-600"
            onClick={() => setIsMenuOpen(false)}
          >
            Masuk
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
