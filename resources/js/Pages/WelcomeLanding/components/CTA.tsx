import React from 'react';

interface Settings {
  'site.contact_email'?: string;
  [key: string]: string | undefined;
}

interface CTAProps {
  settings?: Settings;
}

const CTA: React.FC<CTAProps> = ({ settings }) => {
  const contactEmail = settings?.['site.contact_email'];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Siap mengelola pelanggan dengan lebih baik?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-sky-100">
              Mulai gratis hari ini — tanpa kartu kredit, tanpa instalasi rumit.
              Tim Anda bisa langsung bekerja dalam hitungan menit.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-sky-600 shadow-sm transition-colors hover:bg-sky-50"
              >
                Mulai Sekarang
              </a>
              <a
                href={contactEmail ? `mailto:${contactEmail}` : '#kontak'}
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Hubungi Kami
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
