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
  // Prefer translated marketing description so EN/ID switch works on the landing page.
  const siteDescription = t('landing.footer.description_fallback');
  const siteLogo = settings?.['site.logo'];
  const copyright = t('landing.footer.copyright_fallback', {
    year: new Date().getFullYear(),
    name: siteName,
  });
  const phone = settings?.['site.phone'];
  const address = settings?.['site.address'];
  const contactEmail = settings?.['site.contact_email'];
  const workingHours = settings?.['site.working_hours'];

  return (
    <footer className="border-t border-slate-200 bg-slate-50" id="kontak">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </span>
              )}
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                {siteName}
              </span>
            </div>
            <p className="max-w-sm leading-relaxed text-slate-500">{siteDescription}</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              {t('landing.footer.product_heading')}
            </h4>
            <ul className="space-y-3 text-slate-500">
              <li>
                <a className="transition-colors hover:text-teal-700" href="#modul">
                  {t('landing.footer.features_link')}
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-teal-700" href="#cara-kerja">
                  {t('landing.footer.benefits_link')}
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-teal-700" href="/blog">
                  {t('landing.footer.blog_link')}
                </a>
              </li>
              {canLogin && (
                <li>
                  <Link className="transition-colors hover:text-teal-700" href={route('login')}>
                    {t('landing.footer.login_link')}
                  </Link>
                </li>
              )}
              {canRegister && (
                <li>
                  <Link className="transition-colors hover:text-teal-700" href={route('register')}>
                    {t('landing.footer.register_link')}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              {t('landing.footer.contact_heading')}
            </h4>
            <ul className="space-y-3 text-slate-500">
              {contactEmail && (
                <li>
                  <a className="transition-colors hover:text-teal-700" href={`mailto:${contactEmail}`}>
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
