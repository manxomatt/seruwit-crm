import React from 'react';

const Resources: React.FC = () => {
  const resources = [
    {
      icon: 'menu_book',
      title: 'Panduan Pengguna',
      description: 'Pelajari cara menggunakan Sky Track dari dasar hingga fitur lanjutan dengan panduan lengkap kami.',
      link: '#',
      linkText: 'Baca Panduan',
      color: 'blue',
    },
    {
      icon: 'play_circle',
      title: 'Video Tutorial',
      description: 'Tonton video tutorial step-by-step untuk memaksimalkan penggunaan platform Sky Track.',
      link: '#',
      linkText: 'Tonton Video',
      color: 'green',
    },
    {
      icon: 'help_center',
      title: 'Pusat Bantuan',
      description: 'Temukan jawaban untuk pertanyaan umum dan solusi untuk masalah yang sering dihadapi.',
      link: '#',
      linkText: 'Cari Bantuan',
      color: 'purple',
    },
    {
      icon: 'support_agent',
      title: 'Dukungan Teknis',
      description: 'Tim support kami siap membantu Anda 24/7 untuk menyelesaikan masalah teknis.',
      link: '#',
      linkText: 'Hubungi Support',
      color: 'red',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  };

  return (
    <section className="py-24 bg-white" id="resources">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 mb-6">
            <span className="material-symbols-outlined text-lg">library_books</span>
            Sumber Daya
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 font-display">
            Semua yang Anda Butuhkan untuk{' '}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Sukses
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Akses berbagai sumber daya untuk membantu Anda memaksimalkan penggunaan Sky Track. 
            Dari panduan pemula hingga dokumentasi teknis lengkap.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {resources.map((resource, index) => {
            const colors = colorClasses[resource.color];
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-6`}>
                  <span className={`material-symbols-outlined text-2xl ${colors.text}`}>
                    {resource.icon}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">
                  {resource.title}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {resource.description}
                </p>

                {/* Link */}
                <a
                  href={resource.link}
                  className={`inline-flex items-center gap-2 font-semibold ${colors.text} hover:gap-3 transition-all duration-300`}
                >
                  {resource.linkText}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </a>

                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-2xl ${colors.bg} opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10`}></div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-blue-500">contact_support</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Butuh bantuan lebih lanjut?</p>
                <p className="text-sm text-slate-600">Tim kami siap membantu Anda</p>
              </div>
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined">chat</span>
              Hubungi Kami
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Resources;
