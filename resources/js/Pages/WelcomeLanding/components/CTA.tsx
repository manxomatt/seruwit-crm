import React from 'react';

const CTA: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5"></div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-5xl font-black text-slate-900 mb-8 font-display">Siap Memulai Perjalanan Anda?</h2>
        <p className="text-2xl text-slate-600 mb-12 leading-relaxed">
          Bergabunglah dengan ribuan keluarga dan bisnis yang menemukan ketenangan pikiran dengan teknologi GPS kami yang canggih dan mudah digunakan.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button className="bg-primary text-white px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition-all vibrant-glow">
            Mulai Sekarang!
          </button>
          <button className="bg-white border-2 border-slate-200 text-slate-700 px-12 py-5 rounded-full font-black text-xl hover:bg-slate-50 transition-all">
            Hubungi Tim Kami
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
