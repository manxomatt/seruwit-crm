import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 rounded-t-[3rem] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-primary text-4xl">explore</span>
              <span className="text-3xl font-black tracking-tight font-display">GPSTrack</span>
            </div>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
              The world's most vibrant GPS tracking platform. Making precision fun and security simple for everyone.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-black text-xl mb-6 font-display">Learn</h4>
            <ul className="space-y-4 text-base text-slate-400">
              {['Quick Start Guide', 'API Fun Stuff', 'Helpful Center', 'Vibrant Community'].map((link, i) => (
                <li key={i}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black text-xl mb-6 font-display">Connect</h4>
            <ul className="space-y-4 text-base text-slate-400">
              {['Sales Smiles', 'Tech Support', 'Inquiries', 'Media Fun'].map((link, i) => (
                <li key={i}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black text-xl mb-6 font-display">Rules</h4>
            <ul className="space-y-4 text-base text-slate-400">
              {['Safe Privacy', 'Simple Terms', 'Cookie Policy', 'Safety First'].map((link, i) => (
                <li key={i}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm text-slate-500 font-medium">© 2024 GPSTrack Magic. Built with Joy for a safer world.</p>
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
