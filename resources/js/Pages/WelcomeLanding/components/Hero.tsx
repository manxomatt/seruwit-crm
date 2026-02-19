import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-40 overflow-hidden bg-gradient-to-b from-green-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-center lg:text-left">
          <div className="z-10">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold bg-accent/10 text-accent ring-1 ring-inset ring-accent/20 mb-8 mx-auto lg:mx-0">
              ✨ New: Tracking Joy V3 is Live!
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1] font-display">
              Track with Joy, <span className="text-primary">Live with Peace</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Keep what you love close. Experience real-time freedom with the world's most vibrant and reliable GPS tracking community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-5">
              <button className="bg-accent text-white px-10 py-5 rounded-full font-extrabold text-xl hover:scale-105 transition-all accent-glow">
                Unlock Your Freedom
              </button>
              <button className="border-2 border-slate-200 bg-white text-slate-700 px-10 py-5 rounded-full font-extrabold text-xl hover:bg-slate-50 transition-all">
                See the Magic
              </button>
            </div>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-base font-medium text-slate-500">
              <div className="flex -space-x-3">
                <img className="h-10 w-10 rounded-full border-4 border-white bg-slate-200" src="https://picsum.photos/id/64/100/100" alt="User 1" />
                <img className="h-10 w-10 rounded-full border-4 border-white bg-slate-200" src="https://picsum.photos/id/65/100/100" alt="User 2" />
                <img className="h-10 w-10 rounded-full border-4 border-white bg-slate-200" src="https://picsum.photos/id/103/100/100" alt="User 3" />
              </div>
              <p>Trusted by <span className="text-primary font-bold">50,000+</span> happy adventurers</p>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full"></div>
            <div className="relative w-full aspect-square max-w-[550px] rounded-3xl border-8 border-white bg-white overflow-hidden shadow-2xl rotate-2">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDIzBb5ZOm_bTTu1uujtT-GBf3GrZYHMuBm8oEY5xS7naVi1drint605b-XPYCyAmLQxuTTT-jvaO0U_xWQTtsa9-sSY2F3jTj-_KAn4E5OPz7oIEkRKWqIKltpbTPA78Ufn-h1jDGeQ_NcIAH_NaXX2Eh8x1rF4ssvTYNGahjajPkaXqQeZRyiBupYIs1-zXfKXoSfCZjDBtucE6_fuRv_9eW9waaEeFAw1IAgm1ZpUpSX9gSl4lEumPo9X6Il_kI4fIM-IZYUUEA')` }}
              ></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="h-6 w-6 bg-accent rounded-full animate-ping opacity-75"></div>
                <div className="absolute top-0 left-0 h-6 w-6 bg-accent rounded-full border-4 border-white"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
