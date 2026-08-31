// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Seruwit Rental Mobile API',
  tagline: 'Dokumentasi Lengkap JSON API Aplikasi Mobile Rental Kendaraan',
  favicon: 'img/favicon.ico',

  url: 'https://docs.seruwit.id',
  baseUrl: '/',

  organizationName: 'seruwit',
  projectName: 'seruwit-rental-api-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'id',
    locales: ['id'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Seruwit Rental API',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Dokumentasi API',
          },
          {
            to: '/postman',
            label: 'Postman Collection',
            position: 'left',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Dokumentasi',
            items: [
              {
                label: 'Pengantar & Base URL',
                to: '/',
              },
              {
                label: 'Otentikasi OTP',
                to: '/auth/otp',
              },
              {
                label: 'Verifikasi KYC',
                to: '/kyc/verification',
              },
            ],
          },
          {
            title: 'Siklus Rental',
            items: [
              {
                label: 'Katalog & Simulasi',
                to: '/rental/catalog',
              },
              {
                label: 'Pemesanan',
                to: '/rental/bookings',
              },
              {
                label: 'Pembayaran DP & Pelunasan',
                to: '/rental/payments',
              },
              {
                label: 'Perpanjangan & Check-In',
                to: '/rental/operations',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Seruwit CRM. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['json', 'bash', 'php', 'dart', 'typescript'],
      },
    }),
};

module.exports = config;
