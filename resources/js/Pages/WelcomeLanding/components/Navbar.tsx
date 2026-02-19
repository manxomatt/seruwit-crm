import React, { useState } from 'react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-4xl font-bold">explore</span>
            <span className="text-2xl font-black tracking-tight text-slate-900 font-display">GPSTrack</span>
          </div>
          
          <nav className="hidden md:flex space-x-10">
            <a className="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#features">Features</a>
            <a className="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#pricing">Pricing</a>
            <a className="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#">Resources</a>
          </nav>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <a className="hidden sm:block text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#">Login</a>
            <button className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm sm:text-base hover:scale-105 transition-all vibrant-glow whitespace-nowrap">
              Join Today
            </button>
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
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="#" onClick={() => setIsMenuOpen(false)}>Resources</a>
          <a className="block text-lg font-semibold text-slate-600 hover:text-primary" href="#" onClick={() => setIsMenuOpen(false)}>Login</a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
