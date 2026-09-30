import React from 'react';
import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';
import { DEFAULT_SITE_NAME } from '../constants';

interface Settings {
  'general.site_name'?: string;
  'site.logo'?: string;
  'site.phone'?: string;
  'site.address'?: string;
  'site.contact_email'?: string;
  'site.working_hours'?: string;
  [key: string]: string | undefined;
}

interface FooterProps {
  settings?: Settings;
  canLogin?: boolean;
  canRegister?: boolean;
}

const Footer: React.FC<FooterProps> = ({ settings, canLogin = true, canRegister = true }) => {
  const { t } = useTrans();
  const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
  const siteDescription = t('landing.footer.description_fallback', undefined, 'Platform operasi modular untuk rental kendaraan, armada, dan manajemen keuangan terpadu.');
  const siteLogo = settings?.['site.logo'];
  const copyright = t('landing.footer.copyright_fallback', {
    year: new Date().getFullYear(),
    name: siteName,
  });
  const phone = settings?.['site.phone'];
  const address = settings?.['site.address'];
  const contactEmail = settings?.['site.contact_email'];

  return (
    <footer className="relative border-t border-slate-800 bg-slate-950 text-slate-400" id="kontak">
      {/* Top Subtle Cyan/Teal Ambient Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-auto brightness-0 invert" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20">
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                </span>
              )}
              <span className="font-heading text-lg font-black tracking-tight text-white">
                {siteName}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-xs">{siteDescription}</p>
          </div>

          {/* Solusi Rental */}
          <div>
            <h4 className="font-heading mb-4 text-xs font-black uppercase tracking-wider text-slate-100">
              Operasi Rental & Armada
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a className="transition-colors hover:text-teal-300" href="#rental">Kalender Zero-Conflict</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#rental">Inspeksi Handover Foto</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#rental">Screening Dokumen KTP/SIM</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#armada">Live GPS Telematics</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#armada">Pengingat Pajak & STNK</a></li>
            </ul>
          </div>

          {/* Finansial & Akuntansi */}
          <div>
            <h4 className="font-heading mb-4 text-xs font-black uppercase tracking-wider text-slate-100">
              Akuntansi & Finansial
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a className="transition-colors hover:text-teal-300" href="#akuntansi">Faktur & Payment Gateway</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#akuntansi">Deposit Jaminan Sewa</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#akuntansi">Laba Rugi per Unit Mobil</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#akuntansi">Buku Besar & Neraca</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="#faq">FAQ Pemilik Rental</a></li>
            </ul>
          </div>

          {/* Legalitas & Kontak */}
          <div>
            <h4 className="font-heading mb-4 text-xs font-black uppercase tracking-wider text-slate-100">
              Legalitas & Akses
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><a className="transition-colors hover:text-teal-300" href="/terms">Syarat & Ketentuan</a></li>
              <li><a className="transition-colors hover:text-teal-300" href="/privacy">Kebijakan Privasi</a></li>
              {canLogin && (
                <li>
                  <Link className="transition-colors hover:text-teal-300" href={route('login')}>
                    {t('landing.footer.login_link', undefined, 'Masuk')}
                  </Link>
                </li>
              )}
              {canRegister && (
                <li>
                  <Link className="transition-colors hover:text-teal-300" href={route('register')}>
                    {t('landing.footer.register_link', undefined, 'Daftar')}
                  </Link>
                </li>
              )}
              {contactEmail && (
                <li className="pt-2 text-slate-400">
                  <a className="text-slate-300 transition-colors hover:text-teal-300" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                </li>
              )}
              {phone && <li className="text-slate-400">{phone}</li>}
              {address && <li className="text-slate-500 max-w-xs leading-relaxed">{address}</li>}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-14 border-t border-slate-850 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>{copyright}</div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>All Systems Operational &bull; 99.9% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
