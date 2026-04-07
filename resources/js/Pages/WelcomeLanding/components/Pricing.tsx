import React from 'react';

const Pricing: React.FC = () => {
  return (
    <section className="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" id="pricing">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Trial Card */}
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 md:p-16">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-500/30 mb-8">
              <span className="material-symbols-outlined text-lg">verified</span>
              Penawaran Terbatas
            </div>
            
            {/* Headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 font-display leading-tight">
              Coba Gratis{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                14 Hari
              </span>
            </h2>
            
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Rasakan semua fitur premium tanpa batasan. Tidak perlu kartu kredit, tidak ada komitmen. 
              Batalkan kapan saja.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { icon: 'devices', text: 'Unlimited Perangkat' },
                { icon: 'speed', text: 'Tracking Real-time' },
                { icon: 'history', text: 'Riwayat Lengkap' },
                { icon: 'support_agent', text: 'Dukungan 24/7' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-xl">{feature.icon}</span>
                  </div>
                  <span className="text-white font-semibold text-left">{feature.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="https://app.sky-track.net/#register" 
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-10 py-5 rounded-full font-black text-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Mulai Trial Gratis
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
              <a 
                href="#features" 
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-full font-bold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <span className="material-symbols-outlined">info</span>
                Pelajari Lebih Lanjut
              </a>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400">check_circle</span>
                <span>Tanpa kartu kredit</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400">check_circle</span>
                <span>Setup dalam 5 menit</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400">check_circle</span>
                <span>Batalkan kapan saja</span>
              </div>
            </div>
            
            {/* App Store Badges */}
            <div className="mt-12 pt-12 border-t border-white/10">
              <p className="text-slate-400 text-sm font-medium mb-6">Tersedia di</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Google Play Store */}
                <a 
                  href="#" 
                  className="group flex items-center gap-3 bg-black/50 hover:bg-black/70 border border-white/20 rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z" fill="white"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Dapatkan di</p>
                    <p className="text-white font-bold text-lg -mt-1">Google Play</p>
                  </div>
                </a>
                
                {/* Apple App Store */}
                <a 
                  href="#" 
                  className="group flex items-center gap-3 bg-black/50 hover:bg-black/70 border border-white/20 rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unduh di</p>
                    <p className="text-white font-bold text-lg -mt-1">App Store</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Pengguna Aktif' },
            { value: '4.9/5', label: 'Rating Pengguna' },
            { value: '99.9%', label: 'Uptime Server' },
            { value: '24/7', label: 'Dukungan Teknis' },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-3xl sm:text-4xl font-black text-white font-display">{stat.value}</p>
              <p className="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
