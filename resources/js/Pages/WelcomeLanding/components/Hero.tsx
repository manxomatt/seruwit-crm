import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px]"></div>
        
        {/* Animated Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              🇮🇩 Solusi GPS Tracking #1 di Indonesia
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1] font-display">
              Pantau Aset Anda{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Kapan Saja
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#60A5FA"/>
                      <stop offset="0.5" stopColor="#22D3EE"/>
                      <stop offset="1" stopColor="#2DD4BF"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              <span className="text-slate-300">Dimana Saja</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Lindungi kendaraan, armada, dan aset berharga Anda dengan teknologi GPS tracking real-time terdepan. 
              <span className="text-white font-medium"> Akurat, handal, dan terpercaya.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-12">
              <button className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Mulai Tracking Sekarang
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Lihat Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <img className="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=1" alt="User" />
                  <img className="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=2" alt="User" />
                  <img className="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=3" alt="User" />
                  <img className="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=4" alt="User" />
                </div>
                <span className="text-slate-400">
                  <span className="text-white font-semibold">10,000+</span> Pengguna Aktif
                </span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-700"></div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
                <span className="text-slate-400 ml-1">4.9/5 Rating</span>
              </div>
            </div>
            
            {/* App Store Badges */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <span className="text-slate-500 text-sm font-medium">Tersedia di:</span>
              <div className="flex items-center gap-3">
                {/* Google Play Store */}
                <a 
                  href="#" 
                  className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z" fill="white"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Dapatkan di</p>
                    <p className="text-white font-bold text-sm leading-tight">Google Play</p>
                  </div>
                </a>
                
                {/* Apple App Store */}
                <a 
                  href="#" 
                  className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Unduh di</p>
                    <p className="text-white font-bold text-sm leading-tight">App Store</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Right Content - Interactive Map Preview */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-[80px] rounded-full"></div>
            
            {/* Main Card */}
            <div className="relative w-full max-w-[500px] aspect-square">
              {/* Map Container */}
              <div className="absolute inset-0 rounded-3xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 overflow-hidden shadow-2xl">
                {/* Fake Map Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
                  {/* Map Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                  
                  {/* Indonesia Map Silhouette (simplified) */}
                  <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300" fill="none">
                    <path d="M50 150 Q100 120 150 140 T250 130 T350 150 Q380 160 350 180 T250 190 T150 180 T50 170 Z" fill="currentColor" className="text-blue-400"/>
                  </svg>
                </div>

                {/* Tracking Points */}
                <div className="absolute top-1/4 left-1/4">
                  <div className="relative">
                    <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                  <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white border border-slate-700 whitespace-nowrap">
                    <div className="font-semibold text-green-400">Truk A - B 1234 XY</div>
                    <div className="text-slate-400">Jakarta → Surabaya</div>
                  </div>
                </div>

                <div className="absolute top-1/2 right-1/4">
                  <div className="relative">
                    <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                    <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                  <div className="absolute top-6 -left-20 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white border border-slate-700 whitespace-nowrap">
                    <div className="font-semibold text-blue-400">Motor B - D 5678 AB</div>
                    <div className="text-slate-400">Bandung • 45 km/h</div>
                  </div>
                </div>

                <div className="absolute bottom-1/3 left-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 w-4 h-4 bg-cyan-500 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                    <div className="relative w-4 h-4 bg-cyan-500 rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                </div>

                {/* Route Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>
                  <path 
                    d="M100 100 Q200 80 250 200 T350 250" 
                    stroke="url(#routeGradient)" 
                    strokeWidth="2" 
                    strokeDasharray="8 4"
                    fill="none"
                    className="animate-pulse"
                  />
                </svg>

                {/* Status Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-slate-400">Online: <span className="text-white font-semibold">127</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-slate-400">Idle: <span className="text-white font-semibold">23</span></span>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      Update: <span className="text-cyan-400 font-mono">Real-time</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Cards */}
              <div className="absolute -top-4 -right-4 bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-xs text-slate-400">Uptime Server</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">&lt;1 dtk</div>
                    <div className="text-xs text-slate-400">Update Interval</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Features Strip */}
        <div className="mt-16 lg:mt-24 pt-8 border-t border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold">Real-time Tracking</div>
                <div className="text-sm text-slate-400">Lokasi akurat 24/7</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold">Laporan Lengkap</div>
                <div className="text-sm text-slate-400">Riwayat perjalanan</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold">Notifikasi Instan</div>
                <div className="text-sm text-slate-400">Alert via SMS & App</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold">Keamanan Terjamin</div>
                <div className="text-sm text-slate-400">Enkripsi data end-to-end</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-slate-500 uppercase tracking-widest">Scroll</span>
        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
