import React from 'react';

interface Settings {
  'general.site_name'?: string;
  'general.site_description'?: string;
  'site.logo'?: string;
  'site.copyright'?: string;
  'site.phone'?: string;
  'site.address'?: string;
  'site.contact_email'?: string;
  'site.working_hours'?: string;
  [key: string]: string | undefined;
}

interface FooterProps {
  settings?: Settings;
}

const Footer: React.FC<FooterProps> = ({ settings }) => {
  const siteName = settings?.['general.site_name'] || 'Seruwit CRM';
  const siteDescription = settings?.['general.site_description']
    || 'Platform CRM sederhana untuk membantu bisnis Anda membangun hubungan pelanggan yang lebih baik.';
  const siteLogo = settings?.['site.logo'];
  const copyright = settings?.['site.copyright'] || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  const phone = settings?.['site.phone'];
  const address = settings?.['site.address'];
  const contactEmail = settings?.['site.contact_email'];
  const workingHours = settings?.['site.working_hours'];

  return (
    <footer className="border-t border-slate-100 bg-slate-50" id="kontak">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6.13a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              )}
              <span className="text-lg font-bold tracking-tight text-slate-900">{siteName}</span>
            </div>
            <p className="max-w-sm leading-relaxed text-slate-500">{siteDescription}</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">Produk</h4>
            <ul className="space-y-3 text-slate-500">
              <li><a className="transition-colors hover:text-sky-500" href="#fitur">Fitur</a></li>
              <li><a className="transition-colors hover:text-sky-500" href="#keunggulan">Keunggulan</a></li>
              <li><a className="transition-colors hover:text-sky-500" href="/blog">Blog</a></li>
              <li><a className="transition-colors hover:text-sky-500" href="/login">Masuk</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">Kontak</h4>
            <ul className="space-y-3 text-slate-500">
              {contactEmail && (
                <li>
                  <a className="transition-colors hover:text-sky-500" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                </li>
              )}
              {phone && <li>{phone}</li>}
              {workingHours && <li>{workingHours}</li>}
              {address && <li className="max-w-xs">{address}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-400 md:text-left">
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
