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
          <h2 className="text-lg font-black text-accent uppercase tracking-widest mb-4">Fitur Unggulan</h2>
          <p className="text-4xl sm:text-5xl font-black text-slate-900 font-display mb-6">Semua yang Anda butuhkan untuk tetap terhubung</p>
          <p className="max-w-2xl mx-auto text-xl text-slate-500">Alat sederhana dan canggih yang dirancang untuk keluarga, pecinta hewan peliharaan, dan tim yang berkembang.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard 
            icon="my_location" 
            title="Tampilan Real-Time" 
            description="Pantau pergerakan secara real-time dengan pembaruan setiap detik. Jangan lewatkan setiap momen dari aset berharga Anda."
          />
          <FeatureCard 
            icon="notifications_active" 
            title="Notifikasi Cerdas" 
            description="Tetap terinformasi dengan notifikasi saat target tercapai atau batas wilayah dilanggar. Keamanan yang ramah pengguna."
            accent
          />
          <FeatureCard 
            icon="auto_graph" 
            title="Riwayat Perjalanan" 
            description="Lihat kembali perjalanan terbaik Anda dengan ringkasan rute yang indah dan peta aktivitas yang menceritakan kisah Anda."
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
