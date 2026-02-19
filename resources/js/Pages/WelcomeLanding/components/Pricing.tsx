import React from 'react';

const Pricing: React.FC = () => {
  return (
    <section className="py-32 bg-slate-50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-lg font-black text-primary uppercase tracking-widest mb-4 font-display">Pick Your Joy</h2>
          <p className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 font-display">Simple Pricing for Everyone</p>
          <p className="max-w-2xl mx-auto text-xl text-slate-500">Choose the perfect tier to start your journey today. No hidden fees, just pure peace of mind.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
          <div className="flex flex-col p-10 rounded-[2rem] bg-white border border-slate-200 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-2 font-display">Starter</h3>
            <p className="text-slate-500 font-medium mb-8">Perfect for home heroes</p>
            <div className="flex items-baseline gap-1 mb-10">
              <span className="text-5xl font-black text-slate-900 font-display">$19</span>
              <span className="text-slate-400 font-bold">/mo</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              {['2 Friendly Devices', 'Real-time Happiness', '30-Day History'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                  <span className="material-symbols-outlined text-primary font-bold">check_circle</span>
                  {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-8 rounded-full font-extrabold text-base border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-center">
              Start Here
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
