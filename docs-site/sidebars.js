// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '🚀 Pengantar & Base URL',
    },
    {
      type: 'category',
      label: '🔐 1. Otentikasi & Akun',
      collapsed: false,
      items: [
        'auth/otp',
        'auth/profile',
        'auth/account-deletion',
      ],
    },
    {
      type: 'category',
      label: '🪪 2. Verifikasi Identitas (KYC)',
      collapsed: false,
      items: [
        'kyc/verification',
      ],
    },
    {
      type: 'category',
      label: '🚗 3. Katalog & Pemesanan Rental',
      collapsed: false,
      items: [
        'rental/catalog',
        'rental/bookings',
      ],
    },
    {
      type: 'category',
      label: '💳 4. Pembayaran (Midtrans & Transfer)',
      collapsed: false,
      items: [
        'rental/payments',
      ],
    },
    {
      type: 'category',
      label: '📝 5. Operasional Sewa',
      collapsed: false,
      items: [
        'rental/operations',
      ],
    },
    {
      type: 'doc',
      id: 'postman',
      label: '📦 Postman Collection',
    },
  ],
};

module.exports = sidebars;
