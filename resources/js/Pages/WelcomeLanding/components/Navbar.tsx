import React, { useState } from 'react';

interface Settings {
  'general.site_name'?: string;
  'site.logo'?: string;
  [key: string]: string | undefined;
}

interface NavbarProps {
  settings?: Settings;
}

const Navbar: React.FC<NavbarProps> = ({ settings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const siteName = settings?.['general.site_name'] || 'Sky Track';
  const siteLogo = settings?.['site.logo'];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-10 w-auto" />
            ) : (
              <span className="material-symbols-outlined text-primary text-4xl font-bold">explore</span>
            )}
            <span className="text-2xl font-black tracking-tight text-slate-900 font-display">{siteName}</span>
          </div>
          
          <nav className="hidden md:flex space-x-10">
            <a className="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#features">Fitur</a>
            <a className="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#pricing">Harga</a>
            <a className="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#">Sumber Daya</a>
          </nav>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <a className="hidden sm:block text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="/login">Masuk</a>
            <a href="/register" className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm sm:text-base hover:scale-105 transition-all vibrant-glow whitespace-nowrap">
              Daftar Sekarang
            </a>
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4 animate-in slide-in-from-top duration-300">
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="#features" onClick={() => setIsMenuOpen(false)}>Fitur</a>
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="#pricing" onClick={() => setIsMenuOpen(false)}>Harga</a>
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="#" onClick={() => setIsMenuOpen(false)}>Sumber Daya</a>
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="/login" onClick={() => setIsMenuOpen(false)}>Masuk</a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
