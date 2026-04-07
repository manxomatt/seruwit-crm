import React from 'react';

interface Settings {
  'general.site_name'?: string;
  'general.site_tagline'?: string;
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
  const siteName = settings?.['general.site_name'] || 'Sky Track';
  const siteDescription = settings?.['general.site_description'] || 'The world\'s most vibrant GPS tracking platform. Making precision fun and security simple for everyone.';
  const siteLogo = settings?.['site.logo'];
  const copyright = settings?.['site.copyright'] || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  const phone = settings?.['site.phone'];
  const address = settings?.['site.address'];
  const contactEmail = settings?.['site.contact_email'];
  const workingHours = settings?.['site.working_hours'];

  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 rounded-t-[3rem] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-8">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-10 w-auto" />
              ) : (
                <span className="material-symbols-outlined text-primary text-4xl">explore</span>
              )}
              <span className="text-3xl font-black tracking-tight font-display">{siteName}</span>
            </div>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
              {siteDescription}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-black text-xl mb-6 font-display">Pelajari</h4>
            <ul className="space-y-4 text-base text-slate-400">
              {['Panduan Memulai', 'Dokumentasi API', 'Pusat Bantuan', 'Komunitas'].map((link, i) => (
                <li key={i}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black text-xl mb-6 font-display">Kontak</h4>
            <ul className="space-y-4 text-base text-slate-400">
              {phone && <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">phone</span>{phone}</li>}
              {contactEmail && <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span><a className="hover:text-primary transition-colors" href={`mailto:${contactEmail}`}>{contactEmail}</a></li>}
              {workingHours && <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">schedule</span>{workingHours}</li>}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black text-xl mb-6 font-display">Legal</h4>
            <ul className="space-y-4 text-base text-slate-400">
              {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Kebijakan Cookie', 'Keamanan'].map((link, i) => (
                <li key={i}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {address && (
          <div className="border-t border-slate-800 pt-8 pb-8">
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {address}
            </p>
          </div>
        )}
        
        <div className="border-t border-slate-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm text-slate-500 font-medium">{copyright}</p>
          <div className="flex gap-8">
            <a className="text-slate-500 hover:text-primary transition-colors transform hover:scale-125" href="#">
              <span className="material-symbols-outlined text-2xl">favorite</span>
            </a>
            <a className="text-slate-500 hover:text-primary transition-colors transform hover:scale-125" href="#">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            </a>
            <a className="text-slate-500 hover:text-primary transition-colors transform hover:scale-125" href="#">
              <span className="material-symbols-outlined text-2xl">language</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
