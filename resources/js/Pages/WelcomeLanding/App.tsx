import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import CTA from './components/CTA';
import Footer from './components/Footer';

interface Settings {
  'general.site_name'?: string;
  'general.site_tagline'?: string;
  'general.site_description'?: string;
  'general.date_format'?: string;
  'site.logo'?: string;
  'site.favicon'?: string;
  'site.copyright'?: string;
  'site.phone'?: string;
  'site.address'?: string;
  'site.contact_email'?: string;
  'site.working_hours'?: string;
  [key: string]: string | undefined;
}

interface AppProps {
  settings?: Settings;
}

const App: React.FC<AppProps> = ({ settings }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 antialiased">
      <Navbar settings={settings} />
      <main>
        <Hero settings={settings} />
        <Features />
        <CTA settings={settings} />
      </main>
      <Footer settings={settings} />
    </div>
  );
};

export default App;
