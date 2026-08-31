import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/">
            Mulai Baca Dokumentasi API 🚀
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            style={{ marginLeft: '12px', color: '#fff', borderColor: '#fff' }}
            to="/postman">
            Postman Collection 📦
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Dokumentasi API`}
      description="Dokumentasi lengkap JSON API Aplikasi Mobile Rental Kendaraan Seruwit CRM">
      <HomepageHeader />
      <main>
        <section style={{ padding: '4rem 0' }}>
          <div className="container">
            <div className="row">
              <div className="col col--4">
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <h3>🔐 Otentikasi & KYC</h3>
                  <p>Otentikasi passwordless OTP nomor HP, manajemen profil lengkap, kepatuhan hapus akun Google Play, dan verifikasi KTP/SIM.</p>
                </div>
              </div>
              <div className="col col--4">
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <h3>🚗 Katalog & Reservasi</h3>
                  <p>Filter armada mobil aktif berdasarkan ketersediaan tanggal sewa, simulasi kalkulasi tarif otomatis, dan proteksi idempotency.</p>
                </div>
              </div>
              <div className="col col--4">
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <h3>💳 Pembayaran & Operasional</h3>
                  <p>Pembayaran Midtrans Snap (DP & Pelunasan), transfer manual ke rekening bank, digital check-in tanda tangan, & perpanjangan sewa.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
