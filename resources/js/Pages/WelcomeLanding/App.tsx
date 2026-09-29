import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustSection from './components/TrustSection';
import RentalOperationsSection from './components/RentalOperationsSection';
import FleetRadarSection from './components/FleetRadarSection';
import RentalAccountingSection from './components/RentalAccountingSection';
import ModularEcosystemSection from './components/ModularEcosystemSection';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
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
  canLogin?: boolean;
  canRegister?: boolean;
}

const App: React.FC<AppProps> = ({ settings, canLogin = true, canRegister = true }) => {
  return (
    <div className="landing-page flex min-h-screen flex-col bg-white text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
      <Navbar settings={settings} canLogin={canLogin} canRegister={canRegister} />
      <main>
        <Hero settings={settings} canLogin={canLogin} canRegister={canRegister} />
        <TrustSection />
        <RentalOperationsSection />
        <FleetRadarSection />
        <RentalAccountingSection />
        <ModularEcosystemSection />
        <HowItWorks />
        <FAQ />
        <CTA canLogin={canLogin} canRegister={canRegister} />
      </main>
      <Footer settings={settings} canLogin={canLogin} canRegister={canRegister} />
    </div>
  );
};

export default App;
