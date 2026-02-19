import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  accent?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, accent }) => (
  <div className={`group p-10 rounded-3xl bg-white border border-slate-100 transition-all duration-300 hover:shadow-xl ${accent ? 'hover:border-accent/30' : 'hover:border-primary/30'}`}>
    <div className={`mb-8 inline-block p-4 rounded-2xl transition-all transform group-hover:scale-110 ${accent ? 'bg-accent/10 text-accent group-hover:bg-accent' : 'bg-primary/10 text-primary group-hover:bg-primary'} group-hover:text-white`}>
      <span className="material-symbols-outlined text-4xl">{icon}</span>
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-4 font-display">{title}</h3>
    <p className="text-slate-500 text-lg leading-relaxed">{description}</p>
  </div>
);

const Features: React.FC = () => {
  return (
    <section className="py-32 bg-background-light" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-lg font-black text-accent uppercase tracking-widest mb-4">Amazing Features</h2>
          <p className="text-4xl sm:text-5xl font-black text-slate-900 font-display mb-6">Everything you need to stay connected</p>
          <p className="max-w-2xl mx-auto text-xl text-slate-500">Simple, powerful tools designed for families, pet lovers, and growing teams.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard 
            icon="my_location" 
            title="Live-Action View" 
            description="Watch life move in real-time with 1-second updates. Never miss a heartbeat of your most precious assets."
          />
          <FeatureCard 
            icon="notifications_active" 
            title="Happy Alerts" 
            description="Stay informed with cheerful notifications when goals are met or boundaries are crossed. Safety made friendly."
            accent
          />
          <FeatureCard 
            icon="auto_graph" 
            title="Visual Journeys" 
            description="Relive your best adventures with beautiful path summaries and activity heatmaps that tell your story."
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
