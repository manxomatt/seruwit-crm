import React from 'react';

const Stats: React.FC = () => {
  const stats = [
    { value: '99.9%', label: 'Always On' },
    { value: '120+', label: 'Global Reach' },
    { value: '<1s', label: 'Swift Sync' },
    { value: '24/7', label: 'Here for You' },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 bg-background-soft rounded-[2.5rem] p-12 border border-slate-100 shadow-sm">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-primary font-display">{stat.value}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
