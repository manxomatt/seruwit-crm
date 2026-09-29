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
    <footer className="border-t border-slate-200 bg-slate-50" id="kontak">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 text-white shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                </span>
              )}
              <span className="font-display text-lg font-black tracking-tight text-slate-900">
                {siteName}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 max-w-xs">{siteDescription}</p>
          </div>

          {/* Solusi Rental */}
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-900">
              Operasi Rental & Armada
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a className="transition-colors hover:text-teal-700" href="#rental">Kalender Zero-Conflict</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#rental">Inspeksi Handover Foto</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#rental">Screening Dokumen KTP/SIM</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#armada">Live GPS Telematics</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#armada">Pengingat Pajak & STNK</a></li>
            </ul>
          </div>

          {/* Finansial & Akuntansi */}
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-900">
              Akuntansi & Finansial
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a className="transition-colors hover:text-teal-700" href="#akuntansi">Faktur & Payment Gateway</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#akuntansi">Deposit Jaminan Sewa</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#akuntansi">Laba Rugi per Unit Mobil</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#akuntansi">Buku Besar & Neraca</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="#faq">FAQ Pemilik Rental</a></li>
            </ul>
          </div>

          {/* Legalitas & Kontak */}
          <div>
            <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-900">
              Legalitas & Akses
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a className="transition-colors hover:text-teal-700" href="/terms">Syarat & Ketentuan</a></li>
              <li><a className="transition-colors hover:text-teal-700" href="/privacy">Kebijakan Privasi</a></li>
              {canLogin && (
                <li>
                  <Link className="transition-colors hover:text-teal-700" href={route('login')}>
                    {t('landing.footer.login_link', undefined, 'Masuk')}
                  </Link>
                </li>
              )}
              {canRegister && (
                <li>
                  <Link className="transition-colors hover:text-teal-700" href={route('register')}>
                    {t('landing.footer.register_link', undefined, 'Daftar')}
                  </Link>
                </li>
              )}
              {contactEmail && (
                <li className="pt-2 text-slate-500">
                  <a className="hover:text-teal-700" href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </li>
              )}
              {phone && <li className="text-slate-500">{phone}</li>}
              {address && <li className="text-slate-400 max-w-xs">{address}</li>}
            </ul>
          </div>

        </div>

        <div className="mt-12 border-t border-slate-200/80 pt-8 text-center text-xs text-slate-400 md:text-left">
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
