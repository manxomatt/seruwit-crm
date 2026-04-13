import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import grapesjs, { Editor as GrapesEditor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import axios from 'axios';

interface Page {
    id: number;
    title: string;
    slug: string;
    html: string | null;
    css: string | null;
    gjs_data: Record<string, unknown> | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    page: Page;
}

export default function Editor({ page }: Props): JSX.Element {
    const editorRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<GrapesEditor | null>(null); 
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const saveContent = useCallback(async () => {
        if (!editor) return;

        setIsSaving(true);
        try {
            const html = editor.getHtml();
            const css = editor.getCss();
            const gjsData = editor.getProjectData();

            await axios.patch(route('module.pages.save-content', page.id), {
                html,
                css,
                gjs_data: gjsData,
            });

            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    }, [editor, page.id]);

    useEffect(() => {
        if (!editorRef.current) return;

        const gjsEditor = grapesjs.init({
            container: editorRef.current,
            height: '100%',
            width: 'auto',
            storageManager: false,
            plugins: [gjsBlocksBasic, gjsPresetWebpage],
            pluginsOpts: {
                [gjsBlocksBasic as unknown as string]: {
                    blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video', 'map'],
                    flexGrid: true,
                },
                [gjsPresetWebpage as unknown as string]: {
                    blocksBasicOpts: true,
                    navbarOpts: true,
                    countdownOpts: true,
                    formsOpts: true,
                },
            },
            canvas: {
                styles: [
                    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
                    '/builder/css/custom-builder.css',
                    'href="https://fonts.bunny.net',
                    'https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap',
                    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
                ],
                scripts: [],
                frameStyle: `
                    html, body {
                        background-color: #fff;
                        margin: 0;
                        padding: 0;
                        min-height: 100%;
                        height: auto !important;
                    }
                    * { box-sizing: border-box; }
                    body > * { margin: 0; }
                `,
            },
            deviceManager: {
                devices: [
                    { name: 'Desktop', width: '' },
                    { name: 'Tablet', width: '768px', widthMedia: '992px' },
                    { name: 'Mobile', width: '320px', widthMedia: '480px' },
                ],
            },
            panels: {
                defaults: [
                    {
                        id: 'panel-devices',
                        el: '.panel__devices',
                        buttons: [
                            { id: 'device-desktop', label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z"/></svg>', command: 'set-device-desktop', active: true, togglable: false },
                            { id: 'device-tablet', label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,18H5V6H19M21,4H3C1.89,4 1,4.89 1,6V18A2,2 0 0,0 3,20H21A2,2 0 0,0 23,18V6C23,4.89 22.1,4 21,4Z"/></svg>', command: 'set-device-tablet', togglable: false },
                            { id: 'device-mobile', label: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z"/></svg>', command: 'set-device-mobile', togglable: false },
                        ],
                    },
                ],
            },
        });

        // Add device commands
        gjsEditor.Commands.add('set-device-desktop', {
            run: (editor) => editor.setDevice('Desktop'),
        });
        gjsEditor.Commands.add('set-device-tablet', {
            run: (editor) => editor.setDevice('Tablet'),
        });
        gjsEditor.Commands.add('set-device-mobile', {
            run: (editor) => editor.setDevice('Mobile'),
        });

        // Load existing content
        if (page.gjs_data) {
            gjsEditor.loadProjectData(page.gjs_data);
        } else if (page.html) {
            gjsEditor.setComponents(page.html);
            if (page.css) {
                gjsEditor.setStyle(page.css);
            }
        }

        // Add custom blocks
        const blockManager = gjsEditor.BlockManager;

        blockManager.add('navbar-section', {
            label: 'Navbar',
            category: 'WelcomeLanding',
            content: `
<header class="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-20">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-4xl font-bold">explore</span>
        <span class="text-2xl font-black tracking-tight text-slate-900 font-display">Sky Track</span>
      </div>
      
      <nav class="hidden md:flex space-x-10">
        <a class="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#features">Fitur</a>
        <a class="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#resources">Sumber Daya</a>
        <a class="text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="#pricing">Harga</a>
      </nav>
      
      <div class="flex items-center gap-4 sm:gap-6">
        <a class="hidden sm:block text-base font-semibold text-slate-600 hover:text-primary transition-colors" href="/login">Masuk</a>
        <a href="https://app.sky-track.net/#register" target="_blank" rel="noopener noreferrer" class="bg-primary hover:bg-teal-800 text-white px-6 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 whitespace-nowrap">
          Daftar Sekarang
        </a>
        <button class="md:hidden p-2 text-slate-600">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Mobile Menu -->
  <div class="md:hidden bg-white border-b border-slate-100 p-4 space-y-4">
    <a class="block text-lg font-semibold text-slate-600 hover:text-primary" href="#features">Fitur</a>
    <a class="block text-lg font-semibold text-slate-600 hover:text-primary" href="#resources">Sumber Daya</a>
    <a class="block text-lg font-semibold text-slate-600 hover:text-primary" href="#pricing">Harga</a>
    <a class="block text-lg font-semibold text-slate-600 hover:text-primary" href="/login">Masuk</a>
  </div>
</header>
            `,
        });

        blockManager.add('stats-section', {
            label: 'Stats Section',
            category: 'WelcomeLanding',
            content: `
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-12 bg-background-soft rounded-[2.5rem] p-12 border border-slate-100 shadow-sm">
      <div class="text-center">
        <p class="text-3xl sm:text-4xl font-black text-primary font-display">99.9%</p>
        <p class="text-xs sm:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">Uptime Server</p>
      </div>
      <div class="text-center">
        <p class="text-3xl sm:text-4xl font-black text-primary font-display">120+</p>
        <p class="text-xs sm:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">Kota Terjangkau</p>
      </div>
      <div class="text-center">
        <p class="text-3xl sm:text-4xl font-black text-primary font-display">&lt;1 dtk</p>
        <p class="text-xs sm:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">Sinkronisasi Cepat</p>
      </div>
      <div class="text-center">
        <p class="text-3xl sm:text-4xl font-black text-primary font-display">24/7</p>
        <p class="text-xs sm:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">Siap Melayani</p>
      </div>
    </div>
  </div>
</section>
            `,
        });

        blockManager.add('features-section', {
            label: 'Features Section',
            category: 'WelcomeLanding',
            content: `
<section class="py-32 bg-background-light" id="features">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-24">
      <h2 class="text-lg font-black text-accent uppercase tracking-widest mb-4">Fitur Unggulan</h2>
      <p class="text-4xl sm:text-5xl font-black text-slate-900 font-display mb-6">Semua yang Anda butuhkan untuk tetap terhubung</p>
      <p class="max-w-2xl mx-auto text-xl text-slate-500">Alat sederhana dan canggih yang dirancang untuk keluarga, pecinta hewan peliharaan, dan tim yang berkembang.</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
      <div class="group p-10 rounded-3xl bg-white border border-slate-100 transition-all duration-300 hover:shadow-xl hover:border-primary/30">
        <div class="mb-8 inline-block p-4 rounded-2xl transition-all transform group-hover:scale-110 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white">
          <span class="material-symbols-outlined text-4xl">my_location</span>
        </div>
        <h3 class="text-2xl font-black text-slate-900 mb-4 font-display">Tampilan Real-Time</h3>
        <p class="text-slate-500 text-lg leading-relaxed">Pantau pergerakan secara real-time dengan pembaruan setiap detik. Jangan lewatkan setiap momen dari aset berharga Anda.</p>
      </div>
      <div class="group p-10 rounded-3xl bg-white border border-slate-100 transition-all duration-300 hover:shadow-xl hover:border-accent/30">
        <div class="mb-8 inline-block p-4 rounded-2xl transition-all transform group-hover:scale-110 bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white">
          <span class="material-symbols-outlined text-4xl">notifications_active</span>
        </div>
        <h3 class="text-2xl font-black text-slate-900 mb-4 font-display">Notifikasi Cerdas</h3>
        <p class="text-slate-500 text-lg leading-relaxed">Tetap terinformasi dengan notifikasi saat target tercapai atau batas wilayah dilanggar. Keamanan yang ramah pengguna.</p>
      </div>
      <div class="group p-10 rounded-3xl bg-white border border-slate-100 transition-all duration-300 hover:shadow-xl hover:border-primary/30">
        <div class="mb-8 inline-block p-4 rounded-2xl transition-all transform group-hover:scale-110 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white">
          <span class="material-symbols-outlined text-4xl">auto_graph</span>
        </div>
        <h3 class="text-2xl font-black text-slate-900 mb-4 font-display">Riwayat Perjalanan</h3>
        <p class="text-slate-500 text-lg leading-relaxed">Lihat kembali perjalanan terbaik Anda dengan ringkasan rute yang indah dan peta aktivitas yang menceritakan kisah Anda.</p>
      </div>
    </div>
  </div>
</section>
            `,
        });

        blockManager.add('resources-section', {
            label: 'Resources Section',
            category: 'WelcomeLanding',
            content: `
<section class="py-24 bg-white" id="resources">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Section Header -->
    <div class="text-center mb-16">
      <div class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 mb-6">
        <span class="material-symbols-outlined text-lg">library_books</span>
        Sumber Daya
      </div>
      <h2 class="text-4xl sm:text-5xl font-black text-slate-900 mb-6 font-display">
        Semua yang Anda Butuhkan untuk 
        <span class="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          Sukses
        </span>
      </h2>
      <p class="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
        Akses berbagai sumber daya untuk membantu Anda memaksimalkan penggunaan Sky Track. 
        Dari panduan pemula hingga dokumentasi teknis lengkap.
      </p>
    </div>

    <!-- Resources Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <!-- Resource 1 -->
      <div class="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
        <!-- Icon -->
        <div class="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-2xl text-blue-400">
            menu_book
          </span>
        </div>

        <!-- Content -->
        <h3 class="text-xl font-bold text-slate-900 mb-3 font-display">
          Panduan Pengguna
        </h3>
        <p class="text-slate-600 mb-6 leading-relaxed">
          Pelajari cara menggunakan Sky Track dari dasar hingga fitur lanjutan dengan panduan lengkap kami.
        </p>

        <!-- Link -->
        <a
          href="#"
          class="inline-flex items-center gap-2 font-semibold text-blue-400 hover:gap-3 transition-all duration-300"
        >
          Baca Panduan
          <span class="material-symbols-outlined text-lg">arrow_forward</span>
        </a>

        <!-- Hover Effect -->
        <div class="absolute inset-0 rounded-2xl bg-blue-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
      </div>

      <!-- Resource 2 -->
      <div class="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
        <!-- Icon -->
        <div class="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-2xl text-green-400">
            play_circle
          </span>
        </div>

        <!-- Content -->
        <h3 class="text-xl font-bold text-slate-900 mb-3 font-display">
          Video Tutorial
        </h3>
        <p class="text-slate-600 mb-6 leading-relaxed">
          Tonton video tutorial step-by-step untuk memaksimalkan penggunaan platform Sky Track.
        </p>

        <!-- Link -->
        <a
          href="#"
          class="inline-flex items-center gap-2 font-semibold text-green-400 hover:gap-3 transition-all duration-300"
        >
          Tonton Video
          <span class="material-symbols-outlined text-lg">arrow_forward</span>
        </a>

        <!-- Hover Effect -->
        <div class="absolute inset-0 rounded-2xl bg-green-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
      </div>

      <!-- Resource 3 -->
      <div class="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
        <!-- Icon -->
        <div class="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-2xl text-purple-400">
            help_center
          </span>
        </div>

        <!-- Content -->
        <h3 class="text-xl font-bold text-slate-900 mb-3 font-display">
          Pusat Bantuan
        </h3>
        <p class="text-slate-600 mb-6 leading-relaxed">
          Temukan jawaban untuk pertanyaan umum dan solusi untuk masalah yang sering dihadapi.
        </p>

        <!-- Link -->
        <a
          href="#"
          class="inline-flex items-center gap-2 font-semibold text-purple-400 hover:gap-3 transition-all duration-300"
        >
          Cari Bantuan
          <span class="material-symbols-outlined text-lg">arrow_forward</span>
        </a>

        <!-- Hover Effect -->
        <div class="absolute inset-0 rounded-2xl bg-purple-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
      </div>

      <!-- Resource 4 -->
      <div class="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
        <!-- Icon -->
        <div class="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-2xl text-red-400">
            support_agent
          </span>
        </div>

        <!-- Content -->
        <h3 class="text-xl font-bold text-slate-900 mb-3 font-display">
          Dukungan Teknis
        </h3>
        <p class="text-slate-600 mb-6 leading-relaxed">
          Tim support kami siap membantu Anda 24/7 untuk menyelesaikan masalah teknis.
        </p>

        <!-- Link -->
        <a
          href="#"
          class="inline-flex items-center gap-2 font-semibold text-red-400 hover:gap-3 transition-all duration-300"
        >
          Hubungi Support
          <span class="material-symbols-outlined text-lg">arrow_forward</span>
        </a>

        <!-- Hover Effect -->
        <div class="absolute inset-0 rounded-2xl bg-red-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
      </div>
    </div>

    <!-- Bottom CTA -->
    <div class="mt-16 text-center">
      <div class="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl text-blue-500">contact_support</span>
          </div>
          <div class="text-left">
            <p class="font-bold text-slate-900">Butuh bantuan lebih lanjut?</p>
            <p class="text-sm text-slate-600">Tim kami siap membantu Anda</p>
          </div>
        </div>
        <a
          href="#"
          class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          <span class="material-symbols-outlined">chat</span>
          Hubungi Kami
        </a>
      </div>
    </div>
  </div>
</section>
            `,
        });

        blockManager.add('pricing-section', {
            label: 'Pricing Section',
            category: 'WelcomeLanding',
            content: `
<section class="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" id="pricing">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Main Trial Card -->
    <div class="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-12 md:p-16">
      <!-- Background Glow -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
      <div class="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-[80px]"></div>
      
      <div class="relative z-10 text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-500/30 mb-8">
          <span class="material-symbols-outlined text-lg">verified</span>
          Penawaran Terbatas
        </div>
        
        <!-- Headline -->
        <h2 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 font-display leading-tight">
          Coba Gratis 
          <span class="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            14 Hari
          </span>
        </h2>
        
        <p class="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Rasakan semua fitur premium tanpa batasan. Tidak perlu kartu kredit, tidak ada komitmen. 
          Batalkan kapan saja.
        </p>
        
        <!-- Features Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <!-- Feature 1 -->
          <div class="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-white text-xl">devices</span>
            </div>
            <span class="text-white font-semibold text-left">Unlimited Perangkat</span>
          </div>
          
          <!-- Feature 2 -->
          <div class="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-white text-xl">speed</span>
            </div>
            <span class="text-white font-semibold text-left">Tracking Real-time</span>
          </div>
          
          <!-- Feature 3 -->
          <div class="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-white text-xl">history</span>
            </div>
            <span class="text-white font-semibold text-left">Riwayat Lengkap</span>
          </div>
          
          <!-- Feature 4 -->
          <div class="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-white text-xl">support_agent</span>
            </div>
            <span class="text-white font-semibold text-left">Dukungan 24/7</span>
          </div>
        </div>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="https://app.sky-track.net/#register" 
            target="_blank"
            rel="noopener noreferrer"
            class="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-10 py-5 rounded-full font-black text-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
          >
            <span class="material-symbols-outlined">rocket_launch</span>
            Mulai Trial Gratis
            <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
          <a 
            href="#features" 
            class="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-full font-bold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <span class="material-symbols-outlined">info</span>
            Pelajari Lebih Lanjut
          </a>
        </div>
        
        <!-- Trust Indicators -->
        <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-green-400">check_circle</span>
            <span>Tanpa kartu kredit</span>
          </div>
          <div class="hidden sm:block w-px h-4 bg-slate-600"></div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-green-400">check_circle</span>
            <span>Setup dalam 5 menit</span>
          </div>
          <div class="hidden sm:block w-px h-4 bg-slate-600"></div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-green-400">check_circle</span>
            <span>Batalkan kapan saja</span>
          </div>
        </div>
        
        <!-- App Store Badges -->
        <div class="mt-12 pt-12 border-t border-white/10">
          <p class="text-slate-400 text-sm font-medium mb-6">Tersedia di</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <!-- Google Play Store -->
            <a 
              href="#" 
              class="group flex items-center gap-3 bg-black/50 hover:bg-black/70 border border-white/20 rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105"
            >
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z" fill="white"/>
              </svg>
              <div class="text-left">
                <p class="text-[10px] text-slate-400 uppercase tracking-wider">Dapatkan di</p>
                <p class="text-white font-bold text-lg -mt-1">Google Play</p>
              </div>
            </a>
            
            <!-- Apple App Store -->
            <a 
              href="#" 
              class="group flex items-center gap-3 bg-black/50 hover:bg-black/70 border border-white/20 rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105"
            >
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div class="text-left">
                <p class="text-[10px] text-slate-400 uppercase tracking-wider">Unduh di</p>
                <p class="text-white font-bold text-lg -mt-1">App Store</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Stats -->
    <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div>
        <p class="text-3xl sm:text-4xl font-black text-white font-display">10,000+</p>
        <p class="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wider">Pengguna Aktif</p>
      </div>
      <div>
        <p class="text-3xl sm:text-4xl font-black text-white font-display">4.9/5</p>
        <p class="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wider">Rating Pengguna</p>
      </div>
      <div>
        <p class="text-3xl sm:text-4xl font-black text-white font-display">99.9%</p>
        <p class="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wider">Uptime Server</p>
      </div>
      <div>
        <p class="text-3xl sm:text-4xl font-black text-white font-display">24/7</p>
        <p class="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wider">Dukungan Teknis</p>
      </div>
    </div>
  </div>
</section>
            `,
        });

        blockManager.add('cta-section', {
            label: 'CTA Section',
            category: 'WelcomeLanding',
            content: `
<section class="py-32 relative overflow-hidden">
  <div class="absolute inset-0 bg-primary/5"></div>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
    <h2 class="text-5xl font-black text-slate-900 mb-8 font-display">Siap Memulai Perjalanan Anda?</h2>
    <p class="text-2xl text-slate-600 mb-12 leading-relaxed">
      Bergabunglah dengan ribuan keluarga dan bisnis yang menemukan ketenangan pikiran dengan teknologi GPS kami yang canggih dan mudah digunakan.
    </p>
    <div class="flex flex-col sm:flex-row justify-center gap-6">
      <a href="https://app.sky-track.net/#register" target="_blank" rel="noopener noreferrer" class="bg-primary text-white px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition-all">
        Mulai Sekarang!
      </a>
      <button class="bg-white border-2 border-slate-200 text-slate-700 px-12 py-5 rounded-full font-black text-xl hover:bg-slate-50 transition-all">
        Hubungi Tim Kami
      </button>
    </div>
  </div>
</section>
            `,
        });

        blockManager.add('footer-section', {
            label: 'Footer Section',
            category: 'WelcomeLanding',
            content: `
<footer class="bg-slate-900 text-white pt-24 pb-12 rounded-t-[3rem] mt-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
      <div class="col-span-2 lg:col-span-2">
        <div class="flex items-center gap-2 mb-8">
          <span class="material-symbols-outlined text-primary text-4xl">explore</span>
          <span class="text-3xl font-black tracking-tight font-display">Sky Track</span>
        </div>
        <p class="text-slate-400 text-lg max-w-sm leading-relaxed">
          The world's most vibrant GPS tracking platform. Making precision fun and security simple for everyone.
        </p>
      </div>
      
      <div>
        <h4 class="text-white font-black text-xl mb-6 font-display">Pelajari</h4>
        <ul class="space-y-4 text-base text-slate-400">
          <li><a class="hover:text-primary transition-colors" href="#">Panduan Memulai</a></li>
          <li><a class="hover:text-primary transition-colors" href="#">Dokumentasi API</a></li>
          <li><a class="hover:text-primary transition-colors" href="#">Pusat Bantuan</a></li>
          <li><a class="hover:text-primary transition-colors" href="#">Komunitas</a></li>
        </ul>
      </div>
      
      <div>
        <h4 class="text-white font-black text-xl mb-6 font-display">Kontak</h4>
        <ul class="space-y-4 text-base text-slate-400">
          <li class="flex items-center gap-2"><span class="material-symbols-outlined text-sm">phone</span>+62 812 3456 7890</li>
          <li class="flex items-center gap-2"><span class="material-symbols-outlined text-sm">mail</span><a class="hover:text-primary transition-colors" href="mailto:contact@sky-track.net">contact@sky-track.net</a></li>
          <li class="flex items-center gap-2"><span class="material-symbols-outlined text-sm">schedule</span>Senin - Jumat: 9:00 - 18:00</li>
        </ul>
      </div>
      
      <div>
        <h4 class="text-white font-black text-xl mb-6 font-display">Legal</h4>
        <ul class="space-y-4 text-base text-slate-400">
          <li><a class="hover:text-primary transition-colors" href="#">Kebijakan Privasi</a></li>
          <li><a class="hover:text-primary transition-colors" href="#">Syarat & Ketentuan</a></li>
          <li><a class="hover:text-primary transition-colors" href="#">Kebijakan Cookie</a></li>
          <li><a class="hover:text-primary transition-colors" href="#">Keamanan</a></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-slate-800 pt-8 pb-8">
      <p class="text-slate-400 text-sm flex items-center gap-2">
        <span class="material-symbols-outlined text-sm">location_on</span>
        Jl. Techno No. 123, Jakarta Selatan 12345, Indonesia
      </p>
    </div>
    
    <div class="border-t border-slate-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
      <p class="text-sm text-slate-500 font-medium">© ${new Date().getFullYear()} Sky Track. All rights reserved.</p>
      <div class="flex gap-8">
        <a class="text-slate-500 hover:text-primary transition-colors transform hover:scale-125" href="#">
          <span class="material-symbols-outlined text-2xl">favorite</span>
        </a>
        <a class="text-slate-500 hover:text-primary transition-colors transform hover:scale-125" href="#">
          <span class="material-symbols-outlined text-2xl">rocket_launch</span>
        </a>
        <a class="text-slate-500 hover:text-primary transition-colors transform hover:scale-125" href="#">
          <span class="material-symbols-outlined text-2xl">language</span>
        </a>
      </div>
    </div>
  </div>
</footer>
            `,
        });

        // blockManager.add('navbar-modern-gray', {
        //     label: 'Navbar Modern Gray',
        //     category: 'Sections',
        //     content: `
        //         <header class="fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 shadow-sm" style="position: fixed; top: 0; left: 0; right: 0; z-index: 50;">
        //             <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        //                 <div class="flex justify-between items-center h-16 lg:h-20">
        //                     <!-- Logo -->
        //                     <div class="flex items-center gap-3">
        //                         <div class="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg" style="width: 40px; height: 40px; background: linear-gradient(to bottom right, #374151, #111827); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        //                             <svg class="w-6 h-6 text-white" style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        //                             </svg>
        //                         </div>
        //                         <span class="text-xl lg:text-2xl font-bold" style="font-size: 1.5rem; font-weight: 700; background: linear-gradient(to right, #1f2937, #4b5563); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BrandName</span>
        //                     </div>
                            
        //                     <!-- Desktop Navigation -->
        //                     <nav class="hidden lg:flex items-center gap-1" style="display: flex; align-items: center; gap: 4px;">
        //                         <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#home">Home</a>
        //                         <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#features">Features</a>
        //                         <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#pricing">Pricing</a>
        //                         <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#about">About</a>
        //                         <a class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-200" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; border-radius: 8px; text-decoration: none;" href="#contact">Contact</a>
        //                     </nav>
                            
        //                     <!-- CTA Buttons -->
        //                     <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 12px;">
        //                         <a class="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors" style="padding: 8px 16px; font-size: 14px; font-weight: 500; color: #374151; text-decoration: none;" href="#login">Sign In</a>
        //                         <a class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(to right, #1f2937, #374151); color: white; font-size: 14px; font-weight: 600; border-radius: 12px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(156, 163, 175, 0.3);" href="#signup">
        //                             Get Started
        //                             <svg class="w-4 h-4" style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        //                             </svg>
        //                         </a>
                                
        //                         <!-- Mobile Menu Button -->
        //                         <button class="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors" style="padding: 8px; color: #4b5563; border-radius: 8px; background: transparent; border: none; cursor: pointer;" data-toggle="mobile-menu-gray">
        //                             <svg class="w-6 h-6" style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        //                             </svg>
        //                         </button>
        //                     </div>
        //                 </div>
        //             </div>
                    
        //             <!-- Mobile Menu -->
        //             <div class="hidden lg:hidden bg-white border-t border-gray-200" style="display: none; background: rgba(255,255,255,0.95); border-top: 1px solid #e5e7eb;" data-mobile-menu-gray>
        //                 <div class="max-w-7xl mx-auto px-4 py-4 space-y-1" style="max-width: 80rem; margin: 0 auto; padding: 16px;">
        //                     <a class="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" style="display: block; padding: 12px 16px; font-size: 16px; font-weight: 500; color: #374151; border-radius: 12px; text-decoration: none;" href="#home">Home</a>
        //                     <a class="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" style="display: block; padding: 12px 16px; font-size: 16px; font-weight: 500; color: #374151; border-radius: 12px; text-decoration: none;" href="#features">Features</a>
        //                     <a class="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" style="display: block; padding: 12px 16px; font-size: 16px; font-weight: 500; color: #374151; border-radius: 12px; text-decoration: none;" href="#pricing">Pricing</a>
        //                     <a class="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" style="display: block; padding: 12px 16px; font-size: 16px; font-weight: 500; color: #374151; border-radius: 12px; text-decoration: none;" href="#about">About</a>
        //                     <a class="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" style="display: block; padding: 12px 16px; font-size: 16px; font-weight: 500; color: #374151; border-radius: 12px; text-decoration: none;" href="#contact">Contact</a>
        //                     <div class="pt-4 border-t border-gray-200 mt-4" style="padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 16px;">
        //                         <a class="block w-full text-center px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white font-semibold rounded-xl transition-all" style="display: block; width: 100%; text-align: center; padding: 12px 16px; background: linear-gradient(to right, #1f2937, #374151); color: white; font-weight: 600; border-radius: 12px; text-decoration: none;" href="#signup">Get Started</a>
        //                     </div>
        //                 </div>
        //             </div>
        //         </header>
        //         <!-- Spacer for fixed navbar -->
        //         <div style="height: 80px;"></div>
        //     `,
        // });
        
        // blockManager.add('hero-section', {
        //     label: 'Hero Section',
        //     category: 'Sections',
        //     content: `
        //         <section class="relative pt-16 pb-24 lg:pt-32 lg:pb-40 overflow-hidden bg-gradient-to-b from-green-50/50 to-white">
        //         <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        //           <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        //             <div class="z-10">
        //               <div class="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold bg-orange-500/10 text-orange-500 ring-1 ring-inset ring-orange-500/20 mb-8">
        //                 ✨ New: Tracking Joy V3 is Live!
        //               </div>
        //               <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1] font-display">
        //                 Track with Joy, <span class="text-green-500">Live with Peace</span>
        //               </h1>
        //               <p class="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
        //                 Keep what you love close. Experience real-time freedom with the world's most vibrant and reliable GPS tracking community.
        //               </p>
        //               <div class="flex flex-col sm:flex-row gap-5">
        //                 <button class="bg-orange-500 text-white px-10 py-5 rounded-full font-extrabold text-xl hover:scale-105 transition-all">
        //                   Unlock Your Freedom
        //                 </button>
        //                 <button class="border-2 border-slate-200 bg-white text-slate-700 px-10 py-5 rounded-full font-extrabold text-xl hover:bg-slate-50 transition-all">
        //                   See the Magic
        //                 </button>
        //               </div>
        //             </div>
        //             <div class="relative lg:h-[600px] flex items-center justify-center">
        //               <img src="https://picsum.photos/seed/map/800/800" class="rounded-3xl shadow-2xl rotate-2 border-8 border-white" alt="Map" />
        //             </div>
        //           </div>
        //         </div>
        //       </section>
        //     `,
        // });

        // blockManager.add('hero-gps-tracking-indonesia', {
        //     label: 'Hero GPS Tracking ID',
        //     category: 'Sections',
        //     content: `
        //         <section style="position: relative; min-height: 100vh; overflow: hidden; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);">
        //             <!-- Animated Background Elements -->
        //             <div style="position: absolute; inset: 0; overflow: hidden;">
        //                 <!-- Grid Pattern -->
        //                 <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 60px 60px;"></div>
                        
        //                 <!-- Floating Orbs -->
        //                 <div style="position: absolute; top: 80px; left: 40px; width: 288px; height: 288px; background: rgba(59,130,246,0.2); border-radius: 50%; filter: blur(100px);"></div>
        //                 <div style="position: absolute; bottom: 80px; right: 40px; width: 384px; height: 384px; background: rgba(34,211,238,0.2); border-radius: 50%; filter: blur(120px);"></div>
        //                 <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: rgba(99,102,241,0.1); border-radius: 50%; filter: blur(150px);"></div>
                        
        //                 <!-- Animated Lines -->
        //                 <div style="position: absolute; top: 0; left: 25%; width: 1px; height: 100%; background: linear-gradient(to bottom, transparent, rgba(59,130,246,0.2), transparent);"></div>
        //                 <div style="position: absolute; top: 0; right: 25%; width: 1px; height: 100%; background: linear-gradient(to bottom, transparent, rgba(34,211,238,0.2), transparent);"></div>
        //             </div>

        //             <div style="position: relative; max-width: 80rem; margin: 0 auto; padding: 80px 24px 60px;">
        //                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
        //                     <!-- Left Content -->
        //                     <div style="text-align: left; position: relative; z-index: 10;">
        //                         <!-- Badge -->
        //                         <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; padding: 6px 14px; font-size: 13px; font-weight: 600; background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); margin-bottom: 24px; backdrop-filter: blur(4px);">
        //                             <span style="position: relative; display: flex; height: 8px; width: 8px;">
        //                                 <span style="position: absolute; display: inline-flex; height: 100%; width: 100%; border-radius: 50%; background: #4ade80; opacity: 0.75;"></span>
        //                                 <span style="position: relative; display: inline-flex; border-radius: 50%; height: 8px; width: 8px; background: #22c55e;"></span>
        //                             </span>
        //                             🇮🇩 Solusi GPS Tracking #1 di Indonesia
        //                         </div>

        //                         <!-- Headline -->
        //                         <h1 style="font-size: 3.5rem; font-weight: 800; letter-spacing: -0.025em; color: white; margin-bottom: 20px; line-height: 1.15;">
        //                             Pantau Aset Anda
        //                             <span style="display: block; background: linear-gradient(to right, #60a5fa, #22d3ee, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        //                                 Kapan Saja, Dimana Saja
        //                             </span>
        //                         </h1>

        //                         <!-- Description -->
        //                         <p style="font-size: 1.125rem; color: #94a3b8; margin-bottom: 32px; max-width: 520px; line-height: 1.7;">
        //                             Lindungi kendaraan, armada, dan aset berharga Anda dengan teknologi GPS tracking real-time terdepan.
        //                             <span style="color: white; font-weight: 500;"> Akurat, handal, dan terpercaya.</span>
        //                         </p>

        //                         <!-- CTA Buttons -->
        //                         <div style="display: flex; flex-direction: row; gap: 12px; align-items: center; margin-bottom: 40px;">
        //                             <a href="#" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; box-shadow: 0 8px 30px rgba(59,130,246,0.3); transition: all 0.3s; border: none;">
        //                                 <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        //                                 </svg>
        //                                 Mulai Tracking
        //                                 <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        //                                 </svg>
        //                             </a>
        //                             <a href="#" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.08); backdrop-filter: blur(4px); color: white; padding: 14px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; border: 1px solid rgba(255,255,255,0.15); text-decoration: none; transition: all 0.3s;">
        //                                 <svg style="width: 18px; height: 18px; color: #60a5fa;" fill="currentColor" viewBox="0 0 24 24">
        //                                     <path d="M8 5v14l11-7z"></path>
        //                                 </svg>
        //                                 Lihat Demo
        //                             </a>
        //                         </div>

        //                         <!-- Trust Indicators -->
        //                         <div style="display: flex; flex-direction: row; align-items: center; gap: 24px; font-size: 14px;">
        //                             <div style="display: flex; align-items: center; gap: 10px;">
        //                                 <div style="display: flex;">
        //                                     <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; margin-right: -8px; object-fit: cover;" src="https://i.pravatar.cc/100?img=1" alt="User">
        //                                     <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; margin-right: -8px; object-fit: cover;" src="https://i.pravatar.cc/100?img=2" alt="User">
        //                                     <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; margin-right: -8px; object-fit: cover;" src="https://i.pravatar.cc/100?img=3" alt="User">
        //                                     <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; object-fit: cover;" src="https://i.pravatar.cc/100?img=4" alt="User">
        //                                 </div>
        //                                 <span style="color: #94a3b8;">
        //                                     <span style="color: white; font-weight: 600;">10,000+</span> Pengguna
        //                                 </span>
        //                             </div>
        //                             <div style="width: 1px; height: 24px; background: #334155;"></div>
        //                             <div style="display: flex; align-items: center; gap: 4px;">
        //                                 <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        //                                 <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        //                                 <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        //                                 <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        //                                 <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        //                                 <span style="color: #94a3b8; margin-left: 4px;">4.9/5</span>
        //                             </div>
        //                         </div>
        //                     </div>

        //                     <!-- Interactive Map Preview -->
        //                     <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        //                         <!-- Glow Effect -->
        //                         <div style="position: absolute; inset: -20px; background: linear-gradient(to right, rgba(59,130,246,0.15), rgba(34,211,238,0.15)); filter: blur(60px); border-radius: 50%;"></div>
                                
        //                         <!-- Main Card -->
        //                         <div style="position: relative; width: 100%; max-width: 480px;">
        //                             <!-- Map Container -->
        //                             <div style="position: relative; border-radius: 20px; background: rgba(30,41,59,0.6); backdrop-filter: blur(16px); border: 1px solid rgba(51,65,85,0.5); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); aspect-ratio: 1;">
        //                                 <!-- Fake Map Background -->
        //                                 <div style="position: absolute; inset: 0; background: linear-gradient(135deg, #1e293b, #0f172a);">
        //                                     <!-- Map Grid -->
        //                                     <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px); background-size: 30px 30px;"></div>
        //                                 </div>

        //                                 <!-- Tracking Points -->
        //                                 <div style="position: absolute; top: 25%; left: 25%;">
        //                                     <div style="position: relative;">
        //                                         <div style="width: 14px; height: 14px; background: #22c55e; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
        //                                     </div>
        //                                     <div style="position: absolute; top: 20px; left: 20px; background: rgba(15,23,42,0.95); backdrop-filter: blur(4px); border-radius: 8px; padding: 8px 12px; font-size: 11px; color: white; border: 1px solid #334155; white-space: nowrap;">
        //                                         <div style="font-weight: 600; color: #4ade80;">Truk A - B 1234 XY</div>
        //                                         <div style="color: #94a3b8;">Jakarta → Surabaya</div>
        //                                     </div>
        //                                 </div>

        //                                 <div style="position: absolute; top: 50%; right: 25%;">
        //                                     <div style="position: relative;">
        //                                         <div style="width: 14px; height: 14px; background: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
        //                                     </div>
        //                                     <div style="position: absolute; top: 20px; left: -70px; background: rgba(15,23,42,0.95); backdrop-filter: blur(4px); border-radius: 8px; padding: 8px 12px; font-size: 11px; color: white; border: 1px solid #334155; white-space: nowrap;">
        //                                         <div style="font-weight: 600; color: #60a5fa;">Motor B - D 5678 AB</div>
        //                                         <div style="color: #94a3b8;">Bandung • 45 km/h</div>
        //                                     </div>
        //                                 </div>

        //                                 <div style="position: absolute; bottom: 35%; left: 50%;">
        //                                     <div style="width: 14px; height: 14px; background: #06b6d4; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
        //                                 </div>

        //                                 <!-- Status Bar -->
        //                                 <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15,23,42,0.9); backdrop-filter: blur(4px); border-top: 1px solid rgba(51,65,85,0.5); padding: 14px 16px;">
        //                                     <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
        //                                         <div style="display: flex; align-items: center; gap: 16px;">
        //                                             <div style="display: flex; align-items: center; gap: 6px;">
        //                                                 <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
        //                                                 <span style="color: #94a3b8;">Online: <span style="color: white; font-weight: 600;">127</span></span>
        //                                             </div>
        //                                             <div style="display: flex; align-items: center; gap: 6px;">
        //                                                 <div style="width: 8px; height: 8px; background: #eab308; border-radius: 50%;"></div>
        //                                                 <span style="color: #94a3b8;">Idle: <span style="color: white; font-weight: 600;">23</span></span>
        //                                             </div>
        //                                         </div>
        //                                         <div style="color: #94a3b8;">
        //                                             <span style="color: #22d3ee; font-family: monospace; font-size: 12px;">● Real-time</span>
        //                                         </div>
        //                                     </div>
        //                                 </div>
        //                             </div>

        //                             <!-- Floating Stats Cards -->
        //                             <div style="position: absolute; top: -12px; right: -12px; background: rgba(30,41,59,0.95); backdrop-filter: blur(16px); border-radius: 14px; padding: 14px; border: 1px solid rgba(51,65,85,0.5); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.4);">
        //                                 <div style="display: flex; align-items: center; gap: 10px;">
        //                                     <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #10b981); display: flex; align-items: center; justify-content: center;">
        //                                         <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        //                                         </svg>
        //                                     </div>
        //                                     <div>
        //                                         <div style="font-size: 1.25rem; font-weight: 700; color: white;">99.9%</div>
        //                                         <div style="font-size: 11px; color: #94a3b8;">Uptime</div>
        //                                     </div>
        //                                 </div>
        //                             </div>

        //                             <div style="position: absolute; bottom: -12px; left: -12px; background: rgba(30,41,59,0.95); backdrop-filter: blur(16px); border-radius: 14px; padding: 14px; border: 1px solid rgba(51,65,85,0.5); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.4);">
        //                                 <div style="display: flex; align-items: center; gap: 10px;">
        //                                     <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #6366f1); display: flex; align-items: center; justify-content: center;">
        //                                         <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        //                                         </svg>
        //                                     </div>
        //                                     <div>
        //                                         <div style="font-size: 1.25rem; font-weight: 700; color: white;">&lt;1 dtk</div>
        //                                         <div style="font-size: 11px; color: #94a3b8;">Update</div>
        //                                     </div>
        //                                 </div>
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>

        //                 <!-- Bottom Features Strip -->
        //                 <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(30,41,59,0.8);">
        //                     <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
        //                         <div style="display: flex; align-items: center; gap: 12px;">
        //                             <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                 <svg style="width: 22px; height: 22px; color: #60a5fa;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        //                                 </svg>
        //                             </div>
        //                             <div>
        //                                 <div style="color: white; font-weight: 600; font-size: 14px;">Real-time Tracking</div>
        //                                 <div style="font-size: 12px; color: #64748b;">Lokasi akurat 24/7</div>
        //                             </div>
        //                         </div>
        //                         <div style="display: flex; align-items: center; gap: 12px;">
        //                             <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(34,211,238,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                 <svg style="width: 22px; height: 22px; color: #22d3ee;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        //                                 </svg>
        //                             </div>
        //                             <div>
        //                                 <div style="color: white; font-weight: 600; font-size: 14px;">Laporan Lengkap</div>
        //                                 <div style="font-size: 12px; color: #64748b;">Riwayat perjalanan</div>
        //                             </div>
        //                         </div>
        //                         <div style="display: flex; align-items: center; gap: 12px;">
        //                             <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(34,197,94,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                 <svg style="width: 22px; height: 22px; color: #4ade80;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        //                                 </svg>
        //                             </div>
        //                             <div>
        //                                 <div style="color: white; font-weight: 600; font-size: 14px;">Notifikasi Instan</div>
        //                                 <div style="font-size: 12px; color: #64748b;">Alert SMS & App</div>
        //                             </div>
        //                         </div>
        //                         <div style="display: flex; align-items: center; gap: 12px;">
        //                             <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(168,85,247,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                 <svg style="width: 22px; height: 22px; color: #c084fc;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        //                                 </svg>
        //                             </div>
        //                             <div>
        //                                 <div style="color: white; font-weight: 600; font-size: 14px;">Keamanan Terjamin</div>
        //                                 <div style="font-size: 12px; color: #64748b;">Enkripsi end-to-end</div>
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>

        //             <!-- Scroll Indicator -->
        //             <div style="position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 6px;">
        //                 <span style="font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">Scroll</span>
        //                 <svg style="width: 18px; height: 18px; color: #475569;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        //                 </svg>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('feature-cards', {
        //     label: 'Feature Cards',
        //     category: 'Sections',
        //     content: `
        //         <section class="py-16 bg-gray-50">
        //             <div class="container mx-auto px-4">
        //                 <h2 class="text-3xl font-bold text-center mb-12">Our Features</h2>
        //                 <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        //                     <div class="bg-white p-6 rounded-lg shadow-md">
        //                         <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
        //                             <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 class="text-xl font-semibold mb-2">Fast Performance</h3>
        //                         <p class="text-gray-600">Lightning-fast loading times for the best user experience.</p>
        //                     </div>
        //                     <div class="bg-white p-6 rounded-lg shadow-md">
        //                         <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
        //                             <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 class="text-xl font-semibold mb-2">Easy to Use</h3>
        //                         <p class="text-gray-600">Intuitive drag-and-drop interface for everyone.</p>
        //                     </div>
        //                     <div class="bg-white p-6 rounded-lg shadow-md">
        //                         <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
        //                             <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 class="text-xl font-semibold mb-2">Responsive Design</h3>
        //                         <p class="text-gray-600">Looks great on all devices and screen sizes.</p>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('cta-section', {
        //     label: 'CTA Section',
        //     category: 'Sections',
        //     content: `
        //         <section class="bg-blue-600 py-16">
        //             <div class="container mx-auto px-4 text-center">
        //                 <h2 class="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        //                 <p class="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands of satisfied customers who have transformed their online presence.</p>
        //                 <a href="#" class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">Start Free Trial</a>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('social-proof-logo-bar', {
        //     label: 'Social Proof / Logo Bar',
        //     category: 'Sections',
        //     content: `
        //         <section style="padding: 48px 0; background: linear-gradient(to bottom, #f8fafc, #ffffff);">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <!-- Header -->
        //                 <div style="text-align: center; margin-bottom: 40px;">
        //                     <p style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px;">
        //                         Trusted by Industry Leaders
        //                     </p>
        //                     <h2 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0;">
        //                         Join 10,000+ Companies Worldwide
        //                     </h2>
        //                 </div>
                        
        //                 <!-- Logo Grid -->
        //                 <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 32px; align-items: center; justify-items: center;">
        //                     <!-- Logo 1 -->
        //                     <div style="display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0.6; transition: opacity 0.3s; filter: grayscale(100%);">
        //                         <svg style="height: 32px; width: auto;" viewBox="0 0 120 40" fill="#64748b">
        //                             <rect x="0" y="8" width="40" height="24" rx="4"/>
        //                             <text x="48" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748b">Acme</text>
        //                         </svg>
        //                     </div>
                            
        //                     <!-- Logo 2 -->
        //                     <div style="display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0.6; transition: opacity 0.3s; filter: grayscale(100%);">
        //                         <svg style="height: 32px; width: auto;" viewBox="0 0 120 40" fill="#64748b">
        //                             <circle cx="20" cy="20" r="16"/>
        //                             <text x="44" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748b">Globe</text>
        //                         </svg>
        //                     </div>
                            
        //                     <!-- Logo 3 -->
        //                     <div style="display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0.6; transition: opacity 0.3s; filter: grayscale(100%);">
        //                         <svg style="height: 32px; width: auto;" viewBox="0 0 120 40" fill="#64748b">
        //                             <polygon points="20,4 36,36 4,36"/>
        //                             <text x="44" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748b">Apex</text>
        //                         </svg>
        //                     </div>
                            
        //                     <!-- Logo 4 -->
        //                     <div style="display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0.6; transition: opacity 0.3s; filter: grayscale(100%);">
        //                         <svg style="height: 32px; width: auto;" viewBox="0 0 120 40" fill="#64748b">
        //                             <rect x="4" y="4" width="32" height="32" rx="8" transform="rotate(45 20 20)"/>
        //                             <text x="44" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748b">Cube</text>
        //                         </svg>
        //                     </div>
                            
        //                     <!-- Logo 5 -->
        //                     <div style="display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0.6; transition: opacity 0.3s; filter: grayscale(100%);">
        //                         <svg style="height: 32px; width: auto;" viewBox="0 0 120 40" fill="#64748b">
        //                             <path d="M4 20 L20 4 L36 20 L20 36 Z"/>
        //                             <text x="44" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748b">Prism</text>
        //                         </svg>
        //                     </div>
                            
        //                     <!-- Logo 6 -->
        //                     <div style="display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0.6; transition: opacity 0.3s; filter: grayscale(100%);">
        //                         <svg style="height: 32px; width: auto;" viewBox="0 0 120 40" fill="#64748b">
        //                             <ellipse cx="20" cy="20" rx="18" ry="12"/>
        //                             <text x="44" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748b">Orbit</text>
        //                         </svg>
        //                     </div>
        //                 </div>
                        
        //                 <!-- Stats Row -->
        //                 <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 48px; padding-top: 40px; border-top: 1px solid #e2e8f0;">
        //                     <div style="text-align: center;">
        //                         <div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 4px;">10K+</div>
        //                         <div style="font-size: 14px; color: #64748b; font-weight: 500;">Active Users</div>
        //                     </div>
        //                     <div style="text-align: center;">
        //                         <div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 4px;">99.9%</div>
        //                         <div style="font-size: 14px; color: #64748b; font-weight: 500;">Uptime SLA</div>
        //                     </div>
        //                     <div style="text-align: center;">
        //                         <div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 4px;">50M+</div>
        //                         <div style="font-size: 14px; color: #64748b; font-weight: 500;">Data Points</div>
        //                     </div>
        //                     <div style="text-align: center;">
        //                         <div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 4px;">24/7</div>
        //                         <div style="font-size: 14px; color: #64748b; font-weight: 500;">Support</div>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('social-proof-logo-bar-dark', {
        //     label: 'Logo Bar (Dark)',
        //     category: 'Sections',
        //     content: `
        //         <section style="padding: 64px 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <!-- Header -->
        //                 <div style="text-align: center; margin-bottom: 48px;">
        //                     <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 9999px; padding: 6px 16px; margin-bottom: 16px;">
        //                         <svg style="width: 16px; height: 16px; color: #60a5fa;" fill="currentColor" viewBox="0 0 20 20">
        //                             <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        //                         </svg>
        //                         <span style="font-size: 13px; font-weight: 600; color: #60a5fa;">Trusted Worldwide</span>
        //                     </div>
        //                     <h2 style="font-size: 28px; font-weight: 700; color: white; margin: 0 0 8px 0;">
        //                         Powering the World's Best Teams
        //                     </h2>
        //                     <p style="font-size: 16px; color: #94a3b8; margin: 0;">
        //                         From startups to Fortune 500 companies
        //                     </p>
        //                 </div>
                        
        //                 <!-- Logo Carousel Container -->
        //                 <div style="position: relative; overflow: hidden; padding: 24px 0;">
        //                     <!-- Gradient Overlays -->
        //                     <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 100px; background: linear-gradient(to right, #0f172a, transparent); z-index: 10;"></div>
        //                     <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 100px; background: linear-gradient(to left, #0f172a, transparent); z-index: 10;"></div>
                            
        //                     <!-- Logo Row -->
        //                     <div style="display: flex; align-items: center; justify-content: center; gap: 64px; flex-wrap: wrap;">
        //                         <!-- Logo 1 -->
        //                         <div style="display: flex; align-items: center; gap: 10px; opacity: 0.7;">
        //                             <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
        //                                 <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 24 24">
        //                                     <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        //                                 </svg>
        //                             </div>
        //                             <span style="font-size: 18px; font-weight: 700; color: white;">TechCorp</span>
        //                         </div>
                                
        //                         <!-- Logo 2 -->
        //                         <div style="display: flex; align-items: center; gap: 10px; opacity: 0.7;">
        //                             <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #06b6d4); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
        //                                 <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 24 24">
        //                                     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        //                                 </svg>
        //                             </div>
        //                             <span style="font-size: 18px; font-weight: 700; color: white;">SecureNet</span>
        //                         </div>
                                
        //                         <!-- Logo 3 -->
        //                         <div style="display: flex; align-items: center; gap: 10px; opacity: 0.7;">
        //                             <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b, #ef4444); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
        //                                 <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 24 24">
        //                                     <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        //                                 </svg>
        //                             </div>
        //                             <span style="font-size: 18px; font-weight: 700; color: white;">FastFlow</span>
        //                         </div>
                                
        //                         <!-- Logo 4 -->
        //                         <div style="display: flex; align-items: center; gap: 10px; opacity: 0.7;">
        //                             <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
        //                                 <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 24 24">
        //                                     <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z"/>
        //                                     <path d="M12 6a6 6 0 106 6 6 6 0 00-6-6zm0 10a4 4 0 114-4 4 4 0 01-4 4z"/>
        //                                 </svg>
        //                             </div>
        //                             <span style="font-size: 18px; font-weight: 700; color: white;">CircleAI</span>
        //                         </div>
                                
        //                         <!-- Logo 5 -->
        //                         <div style="display: flex; align-items: center; gap: 10px; opacity: 0.7;">
        //                             <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #06b6d4, #3b82f6); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
        //                                 <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 24 24">
        //                                     <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        //                                 </svg>
        //                             </div>
        //                             <span style="font-size: 18px; font-weight: 700; color: white;">CubeData</span>
        //                         </div>
        //                     </div>
        //                 </div>
                        
        //                 <!-- Testimonial Quote -->
        //                 <div style="margin-top: 48px; text-align: center; max-width: 640px; margin-left: auto; margin-right: auto;">
        //                     <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px;">
        //                         <svg style="width: 32px; height: 32px; color: #3b82f6; margin-bottom: 16px;" fill="currentColor" viewBox="0 0 24 24">
        //                             <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
        //                         </svg>
        //                         <p style="font-size: 18px; color: #e2e8f0; font-style: italic; line-height: 1.7; margin: 0 0 20px 0;">
        //                             "This platform has transformed how we manage our fleet. The real-time tracking and analytics have saved us countless hours and significantly reduced operational costs."
        //                         </p>
        //                         <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
        //                             <img src="https://i.pravatar.cc/48?img=12" alt="Avatar" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #3b82f6;">
        //                             <div style="text-align: left;">
        //                                 <div style="font-weight: 600; color: white;">Sarah Johnson</div>
        //                                 <div style="font-size: 14px; color: #94a3b8;">Operations Director, TechCorp</div>
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('social-proof-minimal', {
        //     label: 'Logo Bar (Minimal)',
        //     category: 'Sections',
        //     content: `
        //         <section style="padding: 32px 0; background: #ffffff; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <div style="display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;">
        //                     <span style="font-size: 13px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">As seen on:</span>
                            
        //                     <!-- Logo placeholders with company names -->
        //                     <div style="display: flex; align-items: center; gap: 32px; margin-left: 16px;">
        //                         <span style="font-size: 20px; font-weight: 700; color: #cbd5e1; letter-spacing: -0.025em;">Forbes</span>
        //                         <span style="font-size: 20px; font-weight: 700; color: #cbd5e1; letter-spacing: -0.025em;">TechCrunch</span>
        //                         <span style="font-size: 20px; font-weight: 700; color: #cbd5e1; letter-spacing: -0.025em;">Wired</span>
        //                         <span style="font-size: 20px; font-weight: 700; color: #cbd5e1; letter-spacing: -0.025em;">Bloomberg</span>
        //                         <span style="font-size: 20px; font-weight: 700; color: #cbd5e1; letter-spacing: -0.025em;">Reuters</span>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('benefits-features', {
        //     label: 'Benefits & Features (The Why)',
        //     category: 'Sections',
        //     content: `
        //         <section style="padding: 80px 0; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <!-- Section Header -->
        //                 <div style="text-align: center; margin-bottom: 64px;">
        //                     <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 9999px; padding: 6px 16px; margin-bottom: 16px;">
        //                         <svg style="width: 16px; height: 16px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        //                         </svg>
        //                         <span style="font-size: 13px; font-weight: 600; color: #3b82f6;">Why Choose Us</span>
        //                     </div>
        //                     <h2 style="font-size: 36px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.2;">
        //                         Everything You Need to
        //                         <span style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Succeed</span>
        //                     </h2>
        //                     <p style="font-size: 18px; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        //                         Discover the powerful features and benefits that make our solution the perfect choice for your business.
        //                     </p>
        //                 </div>

        //                 <!-- Features Grid -->
        //                 <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-bottom: 64px;">
        //                     <!-- Feature 1 -->
        //                     <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; transition: all 0.3s;">
        //                         <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        //                             <svg style="width: 28px; height: 28px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Lightning Fast</h3>
        //                         <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        //                             Experience blazing-fast performance with our optimized infrastructure. Load times under 100ms guaranteed.
        //                         </p>
        //                     </div>

        //                     <!-- Feature 2 -->
        //                     <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; transition: all 0.3s;">
        //                         <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        //                             <svg style="width: 28px; height: 28px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Bank-Level Security</h3>
        //                         <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        //                             Your data is protected with enterprise-grade encryption and security protocols. SOC 2 Type II certified.
        //                         </p>
        //                     </div>

        //                     <!-- Feature 3 -->
        //                     <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; transition: all 0.3s;">
        //                         <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        //                             <svg style="width: 28px; height: 28px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Flexible & Scalable</h3>
        //                         <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        //                             Grow without limits. Our platform scales automatically to handle millions of requests seamlessly.
        //                         </p>
        //                     </div>

        //                     <!-- Feature 4 -->
        //                     <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; transition: all 0.3s;">
        //                         <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        //                             <svg style="width: 28px; height: 28px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Advanced Analytics</h3>
        //                         <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        //                             Get deep insights with real-time analytics and customizable dashboards. Make data-driven decisions.
        //                         </p>
        //                     </div>

        //                     <!-- Feature 5 -->
        //                     <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; transition: all 0.3s;">
        //                         <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #ec4899, #db2777); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        //                             <svg style="width: 28px; height: 28px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Team Collaboration</h3>
        //                         <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        //                             Work together seamlessly with built-in collaboration tools. Real-time sync across all team members.
        //                         </p>
        //                     </div>

        //                     <!-- Feature 6 -->
        //                     <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; transition: all 0.3s;">
        //                         <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        //                             <svg style="width: 28px; height: 28px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">24/7 Support</h3>
        //                         <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        //                             Our dedicated support team is always here to help. Average response time under 5 minutes.
        //                         </p>
        //                     </div>
        //                 </div>

        //                 <!-- Bottom CTA -->
        //                 <div style="text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 24px; padding: 48px; position: relative; overflow: hidden;">
        //                     <!-- Background decoration -->
        //                     <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(59, 130, 246, 0.1); border-radius: 50%; filter: blur(60px);"></div>
        //                     <div style="position: absolute; bottom: -50px; left: -50px; width: 200px; height: 200px; background: rgba(139, 92, 246, 0.1); border-radius: 50%; filter: blur(60px);"></div>
                            
        //                     <div style="position: relative; z-index: 1;">
        //                         <h3 style="font-size: 28px; font-weight: 700; color: white; margin: 0 0 12px 0;">Ready to Get Started?</h3>
        //                         <p style="font-size: 16px; color: #94a3b8; margin: 0 0 24px 0; max-width: 500px; margin-left: auto; margin-right: auto;">
        //                             Join thousands of satisfied customers who have transformed their business with our platform.
        //                         </p>
        //                         <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
        //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; text-decoration: none; box-shadow: 0 8px 30px rgba(59, 130, 246, 0.3);">
        //                                 Start Free Trial
        //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        //                                 </svg>
        //                             </a>
        //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(4px); color: white; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; text-decoration: none; border: 1px solid rgba(255, 255, 255, 0.2);">
        //                                 Schedule Demo
        //                             </a>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('how-it-works', {
        //     label: 'How It Works (The Process)',
        //     category: 'Sections',
        //     content: `
        //         <section style="padding: 80px 0; background: #ffffff;">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <!-- Section Header -->
        //                 <div style="text-align: center; margin-bottom: 64px;">
        //                     <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 9999px; padding: 6px 16px; margin-bottom: 16px;">
        //                         <svg style="width: 16px; height: 16px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
        //                         </svg>
        //                         <span style="font-size: 13px; font-weight: 600; color: #10b981;">Simple Process</span>
        //                     </div>
        //                     <h2 style="font-size: 36px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.2;">
        //                         How It Works
        //                     </h2>
        //                     <p style="font-size: 18px; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        //                         Get started in minutes with our simple 4-step process. No technical expertise required.
        //                     </p>
        //                 </div>

        //                 <!-- Steps Container -->
        //                 <div style="position: relative;">
        //                     <!-- Connection Line (Desktop) -->
        //                     <div style="position: absolute; top: 60px; left: 12.5%; right: 12.5%; height: 2px; background: linear-gradient(to right, #e2e8f0, #3b82f6, #8b5cf6, #10b981, #e2e8f0); z-index: 0;"></div>

        //                     <!-- Steps Grid -->
        //                     <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; position: relative; z-index: 1;">
        //                         <!-- Step 1 -->
        //                         <div style="text-align: center;">
        //                             <div style="position: relative; margin-bottom: 24px;">
        //                                 <div style="width: 120px; height: 120px; margin: 0 auto; background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #bfdbfe; box-shadow: 0 10px 40px -10px rgba(59, 130, 246, 0.3);">
        //                                     <svg style="width: 48px; height: 48px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
        //                                     </svg>
        //                                 </div>
        //                                 <div style="position: absolute; top: -8px; right: calc(50% - 60px); width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">1</div>
        //                             </div>
        //                             <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Create Account</h3>
        //                             <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
        //                                 Sign up in seconds with your email or social accounts. No credit card required.
        //                             </p>
        //                         </div>

        //                         <!-- Step 2 -->
        //                         <div style="text-align: center;">
        //                             <div style="position: relative; margin-bottom: 24px;">
        //                                 <div style="width: 120px; height: 120px; margin: 0 auto; background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #c4b5fd; box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.3);">
        //                                     <svg style="width: 48px; height: 48px; color: #8b5cf6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        //                                     </svg>
        //                                 </div>
        //                                 <div style="position: absolute; top: -8px; right: calc(50% - 60px); width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">2</div>
        //                             </div>
        //                             <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Configure Settings</h3>
        //                             <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
        //                                 Customize your preferences and connect your existing tools in just a few clicks.
        //                             </p>
        //                         </div>

        //                         <!-- Step 3 -->
        //                         <div style="text-align: center;">
        //                             <div style="position: relative; margin-bottom: 24px;">
        //                                 <div style="width: 120px; height: 120px; margin: 0 auto; background: linear-gradient(135deg, #fdf4ff, #fae8ff); border-radius: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #f0abfc; box-shadow: 0 10px 40px -10px rgba(236, 72, 153, 0.3);">
        //                                     <svg style="width: 48px; height: 48px; color: #ec4899;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        //                                     </svg>
        //                                 </div>
        //                                 <div style="position: absolute; top: -8px; right: calc(50% - 60px); width: 32px; height: 32px; background: linear-gradient(135deg, #ec4899, #db2777); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);">3</div>
        //                             </div>
        //                             <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Import Data</h3>
        //                             <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
        //                                 Easily import your existing data or start fresh. We support all major formats.
        //                             </p>
        //                         </div>

        //                         <!-- Step 4 -->
        //                         <div style="text-align: center;">
        //                             <div style="position: relative; margin-bottom: 24px;">
        //                                 <div style="width: 120px; height: 120px; margin: 0 auto; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #6ee7b7; box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.3);">
        //                                     <svg style="width: 48px; height: 48px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
        //                                     </svg>
        //                                 </div>
        //                                 <div style="position: absolute; top: -8px; right: calc(50% - 60px); width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">4</div>
        //                             </div>
        //                             <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Start Growing</h3>
        //                             <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
        //                                 You're all set! Start using the platform and watch your business grow.
        //                             </p>
        //                         </div>
        //                     </div>
        //                 </div>

        //                 <!-- Bottom Info Cards -->
        //                 <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 64px;">
        //                     <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px; padding: 24px; display: flex; align-items: start; gap: 16px;">
        //                         <div style="width: 48px; height: 48px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        //                             <svg style="width: 24px; height: 24px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        //                             </svg>
        //                         </div>
        //                         <div>
        //                             <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">Quick Setup</h4>
        //                             <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">Get started in under 5 minutes with our guided onboarding.</p>
        //                         </div>
        //                     </div>

        //                     <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px; padding: 24px; display: flex; align-items: start; gap: 16px;">
        //                         <div style="width: 48px; height: 48px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        //                             <svg style="width: 24px; height: 24px; color: #8b5cf6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
        //                             </svg>
        //                         </div>
        //                         <div>
        //                             <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">24/7 Support</h4>
        //                             <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">Our team is always available to help you succeed.</p>
        //                         </div>
        //                     </div>

        //                     <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px; padding: 24px; display: flex; align-items: start; gap: 16px;">
        //                         <div style="width: 48px; height: 48px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
        //                             <svg style="width: 24px; height: 24px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        //                             </svg>
        //                         </div>
        //                         <div>
        //                             <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">No Risk</h4>
        //                             <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">Free trial with no credit card. Cancel anytime.</p>
        //                         </div>
        //                     </div>
        //                 </div>

        //                 <!-- CTA Button -->
        //                 <div style="text-align: center; margin-top: 48px;">
        //                     <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.5);">
        //                         Get Started Now
        //                         <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        //                         </svg>
        //                     </a>
        //                     <p style="font-size: 14px; color: #94a3b8; margin-top: 12px;">No credit card required • Free 14-day trial</p>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('footer', {
        //     label: 'Footer',
        //     category: 'Sections',
        //     content: `
        //         <footer class="bg-gray-900 text-gray-300 py-12">
        //             <div class="container mx-auto px-4">
        //                 <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        //                     <div>
        //                         <h3 class="text-white font-bold text-lg mb-4">Company</h3>
        //                         <ul class="space-y-2">
        //                             <li><a href="#" class="hover:text-white transition">About Us</a></li>
        //                             <li><a href="#" class="hover:text-white transition">Careers</a></li>
        //                             <li><a href="#" class="hover:text-white transition">Contact</a></li>
        //                         </ul>
        //                     </div>
        //                     <div>
        //                         <h3 class="text-white font-bold text-lg mb-4">Products</h3>
        //                         <ul class="space-y-2">
        //                             <li><a href="#" class="hover:text-white transition">Features</a></li>
        //                             <li><a href="#" class="hover:text-white transition">Pricing</a></li>
        //                             <li><a href="#" class="hover:text-white transition">Templates</a></li>
        //                         </ul>
        //                     </div>
        //                     <div>
        //                         <h3 class="text-white font-bold text-lg mb-4">Resources</h3>
        //                         <ul class="space-y-2">
        //                             <li><a href="#" class="hover:text-white transition">Documentation</a></li>
        //                             <li><a href="#" class="hover:text-white transition">Blog</a></li>
        //                             <li><a href="#" class="hover:text-white transition">Support</a></li>
        //                         </ul>
        //                     </div>
        //                     <div>
        //                         <h3 class="text-white font-bold text-lg mb-4">Legal</h3>
        //                         <ul class="space-y-2">
        //                             <li><a href="#" class="hover:text-white transition">Privacy Policy</a></li>
        //                             <li><a href="#" class="hover:text-white transition">Terms of Service</a></li>
        //                         </ul>
        //                     </div>
        //                 </div>
        //                 <div class="border-t border-gray-800 mt-8 pt-8 text-center">
        //                     <p>&copy; 2024 Your Company. All rights reserved.</p>
        //                 </div>
        //             </div>
        //         </footer>
        //     `,
        // });

        // // Footer with Dynamic Settings - uses {{setting:key}} placeholders
        // blockManager.add('footer-dynamic', {
        //     label: 'Footer (Dynamic)',
        //     category: 'Sections',
        //     content: `
        //         <footer style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #94a3b8; padding: 64px 0 32px;">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <!-- Top Section -->
        //                 <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px;">
        //                     <!-- Brand Column -->
        //                     <div>
        //                         <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        //                             <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        //                                 <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        //                                 </svg>
        //                             </div>
        //                             <span style="font-size: 22px; font-weight: 700; color: white;">{{setting:general.site_name}}</span>
        //                         </div>
        //                         <p style="font-size: 15px; line-height: 1.7; color: #94a3b8; margin-bottom: 24px; max-width: 320px;">
        //                             {{setting:general.site_description}}
        //                         </p>
        //                         <!-- Social Links -->
        //                         <div style="display: flex; gap: 12px;">
        //                             <a href="{{setting:social.facebook}}" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; text-decoration: none; transition: all 0.3s;">
        //                                 <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        //                             </a>
        //                             <a href="{{setting:social.instagram}}" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; text-decoration: none; transition: all 0.3s;">
        //                                 <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        //                             </a>
        //                             <a href="{{setting:social.twitter}}" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; text-decoration: none; transition: all 0.3s;">
        //                                 <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        //                             </a>
        //                             <a href="{{setting:social.youtube}}" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; text-decoration: none; transition: all 0.3s;">
        //                                 <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        //                             </a>
        //                             <a href="{{setting:social.linkedin}}" style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; text-decoration: none; transition: all 0.3s;">
        //                                 <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        //                             </a>
        //                         </div>
        //                     </div>
                            
        //                     <!-- Quick Links -->
        //                     <div>
        //                         <h4 style="font-size: 14px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px;">Company</h4>
        //                         <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">About Us</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Careers</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Press</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Blog</a></li>
        //                         </ul>
        //                     </div>
                            
        //                     <!-- Products -->
        //                     <div>
        //                         <h4 style="font-size: 14px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px;">Products</h4>
        //                         <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Features</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Pricing</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Templates</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Integrations</a></li>
        //                         </ul>
        //                     </div>
                            
        //                     <!-- Support -->
        //                     <div>
        //                         <h4 style="font-size: 14px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px;">Support</h4>
        //                         <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Help Center</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Documentation</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">API Reference</a></li>
        //                             <li><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 15px; transition: color 0.3s;">Status</a></li>
        //                         </ul>
        //                     </div>
                            
        //                     <!-- Contact -->
        //                     <div>
        //                         <h4 style="font-size: 14px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px;">Contact</h4>
        //                         <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
        //                             <li style="display: flex; align-items: start; gap: 10px; color: #94a3b8; font-size: 15px;">
        //                                 <svg style="width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        //                                 </svg>
        //                                 <span>{{setting:site.address}}</span>
        //                             </li>
        //                             <li style="display: flex; align-items: center; gap: 10px;">
        //                                 <svg style="width: 18px; height: 18px; flex-shrink: 0; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        //                                 </svg>
        //                                 <a href="tel:{{setting:site.phone}}" style="color: #94a3b8; text-decoration: none; font-size: 15px;">{{setting:site.phone}}</a>
        //                             </li>
        //                             <li style="display: flex; align-items: center; gap: 10px;">
        //                                 <svg style="width: 18px; height: 18px; flex-shrink: 0; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        //                                 </svg>
        //                                 <a href="mailto:{{setting:site.contact_email}}" style="color: #94a3b8; text-decoration: none; font-size: 15px;">{{setting:site.contact_email}}</a>
        //                             </li>
        //                             <li style="display: flex; align-items: center; gap: 10px;">
        //                                 <svg style="width: 18px; height: 18px; flex-shrink: 0; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        //                                 </svg>
        //                                 <span style="color: #94a3b8; font-size: 15px;">{{setting:site.working_hours}}</span>
        //                             </li>
        //                         </ul>
        //                     </div>
        //                 </div>
                        
        //                 <!-- Bottom Section -->
        //                 <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        //                     <p style="font-size: 14px; color: #64748b; margin: 0;">
        //                         {{setting:site.copyright}}
        //                     </p>
        //                     <div style="display: flex; align-items: center; gap: 24px;">
        //                         <a href="#" style="font-size: 14px; color: #64748b; text-decoration: none; transition: color 0.3s;">Privacy Policy</a>
        //                         <a href="#" style="font-size: 14px; color: #64748b; text-decoration: none; transition: color 0.3s;">Terms of Service</a>
        //                         <a href="#" style="font-size: 14px; color: #64748b; text-decoration: none; transition: color 0.3s;">Cookie Policy</a>
        //                     </div>
        //                 </div>
        //             </div>
        //         </footer>
        //     `,
        // });

        // ==========================================
        // WelcomeLanding Section Components
        // ==========================================

    //     blockManager.add('wl-navbar', {
    //         label: 'WL Navbar',
    //         category: 'WelcomeLanding',
    //         content: `
    //             <header class="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md" style="position: sticky; top: 0; z-index: 50; width: 100%; border-bottom: 1px solid #f1f5f9; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);">
    //                 <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
    //                     <div style="display: flex; justify-content: space-between; align-items: center; height: 80px;">
    //                         <div style="display: flex; align-items: center; gap: 8px;">
    //                             <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    //                             </svg>
    //                             <span style="font-size: 1.5rem; font-weight: 900; letter-spacing: -0.025em; color: #0f172a;">Sky Track</span>
    //                         </div>
                            
    //                         <nav style="display: flex; gap: 40px;">
    //                             <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="#features">Fitur</a>
    //                             <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="#resources">Sumber Daya</a>
    //                             <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="#pricing">Harga</a>
    //                         </nav>
                            
    //                         <div style="display: flex; align-items: center; gap: 24px;">
    //                             <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="/login">Masuk</a>
    //                             <a href="#register" style="background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 10px 24px; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; text-decoration: none; box-shadow: 0 4px 14px rgba(59,130,246,0.4);">
    //                                 Daftar Sekarang
    //                             </a>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </header>
    //         `,
    //     });

    //     blockManager.add('wl-hero', {
    //         label: 'WL Hero',
    //         category: 'WelcomeLanding',
    //         content: `
    // <section class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
    //   <!-- Animated Background Elements -->
    //   <div class="absolute inset-0 overflow-hidden">
    //     <!-- Grid Pattern -->
    //     <div class="absolute inset-0" style="background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 60px 60px;"></div>
        
    //     <!-- Floating Orbs -->
    //     <div class="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full opacity-20" style="filter: blur(100px);"></div>
    //     <div class="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full opacity-20" style="filter: blur(120px);"></div>
    //     <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full opacity-10" style="filter: blur(150px);"></div>
        
    //     <!-- Animated Lines -->
    //     <div class="absolute top-0 left-1/4 w-px h-full" style="background: linear-gradient(to bottom, transparent, rgba(59,130,246,0.2), transparent);"></div>
    //     <div class="absolute top-0 right-1/4 w-px h-full" style="background: linear-gradient(to bottom, transparent, rgba(34,211,238,0.2), transparent);"></div>
    //   </div>

    //   <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-32 lg:pb-28">
    //     <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
    //       <!-- Left Content -->
    //       <div class="text-center lg:text-left z-10">
    //         <!-- Badge -->
    //         <div class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-blue-500 bg-opacity-10 text-blue-400 ring-1 ring-inset ring-blue-500 ring-opacity-20 mb-8" style="backdrop-filter: blur(4px);">
    //           <span class="relative flex h-2 w-2">
    //             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
    //             <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    //           </span>
    //           🇮🇩 Solusi GPS Tracking #1 di Indonesia
    //         </div>

    //         <!-- Headline -->
    //         <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white mb-6" style="line-height: 1.1;">
    //           Pantau Aset Anda 
    //           <span class="relative">
    //             <span style="background: linear-gradient(to right, #60a5fa, #22d3ee, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
    //               Kapan Saja
    //             </span>
    //             <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
    //               <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#gradient)" stroke-width="3" stroke-linecap="round"/>
    //               <defs>
    //                 <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
    //                   <stop stop-color="#60A5FA"/>
    //                   <stop offset="0.5" stop-color="#22D3EE"/>
    //                   <stop offset="1" stop-color="#2DD4BF"/>
    //                 </linearGradient>
    //               </defs>
    //             </svg>
    //           </span>
    //           <br />
    //           <span class="text-slate-300">Dimana Saja</span>
    //         </h1>

    //         <!-- Description -->
    //         <p class="text-lg sm:text-xl text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
    //           Lindungi kendaraan, armada, dan aset berharga Anda dengan teknologi GPS tracking real-time terdepan. 
    //           <span class="text-white font-medium"> Akurat, handal, dan terpercaya.</span>
    //         </p>

    //         <!-- CTA Buttons -->
    //         <div class="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-12">
    //           <a href="https://app.sky-track.net/#register" target="_blank" rel="noopener noreferrer" class="group relative inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg" style="background: linear-gradient(to right, #3b82f6, #06b6d4); box-shadow: 0 10px 25px rgba(59,130,246,0.25);">
    //             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    //             </svg>
    //             Mulai Tracking Sekarang
    //             <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    //             </svg>
    //           </a>
    //           <a href="https://app.sky-track.net/#demo" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 bg-white bg-opacity-5 text-white px-8 py-4 rounded-xl font-bold text-lg border border-white border-opacity-10 hover:bg-opacity-10 hover:border-opacity-20 transition-all duration-300" style="backdrop-filter: blur(4px);">
    //             <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    //               <path d="M8 5v14l11-7z"/>
    //             </svg>
    //             Lihat Demo
    //           </a>
    //         </div>

    //         <!-- Trust Indicators -->
    //         <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm">
    //           <div class="flex items-center gap-2">
    //             <div class="flex -space-x-2">
    //               <img class="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=1" alt="User" />
    //               <img class="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=2" alt="User" />
    //               <img class="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=3" alt="User" />
    //               <img class="h-8 w-8 rounded-full border-2 border-slate-800 bg-slate-700" src="https://i.pravatar.cc/100?img=4" alt="User" />
    //             </div>
    //             <span class="text-slate-400">
    //               <span class="text-white font-semibold">10,000+</span> Pengguna Aktif
    //             </span>
    //           </div>
    //           <div class="hidden sm:block w-px h-6 bg-slate-700"></div>
    //           <div class="flex items-center gap-1">
    //             <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    //               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    //             </svg>
    //             <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    //               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    //             </svg>
    //             <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    //               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    //             </svg>
    //             <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    //               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    //             </svg>
    //             <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    //               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    //             </svg>
    //             <span class="text-slate-400 ml-1">4.9/5 Rating</span>
    //           </div>
    //         </div>
            
    //         <!-- App Store Badges -->
    //         <div class="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
    //           <span class="text-slate-500 text-sm font-medium">Tersedia di:</span>
    //           <div class="flex items-center gap-3">
    //             <!-- Google Play Store -->
    //             <a href="#" class="group flex items-center gap-2 bg-white bg-opacity-5 hover:bg-opacity-10 border border-white border-opacity-10 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105">
    //               <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    //                 <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z" fill="white"/>
    //               </svg>
    //               <div class="text-left">
    //                 <p class="text-slate-400 uppercase tracking-wider leading-none" style="font-size: 9px;">Dapatkan di</p>
    //                 <p class="text-white font-bold text-sm leading-tight">Google Play</p>
    //               </div>
    //             </a>
                
    //             <!-- Apple App Store -->
    //             <a href="#" class="group flex items-center gap-2 bg-white bg-opacity-5 hover:bg-opacity-10 border border-white border-opacity-10 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105">
    //               <svg class="w-6 h-6" viewBox="0 0 24 24" fill="white">
    //                 <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    //               </svg>
    //               <div class="text-left">
    //                 <p class="text-slate-400 uppercase tracking-wider leading-none" style="font-size: 9px;">Unduh di</p>
    //                 <p class="text-white font-bold text-sm leading-tight">App Store</p>
    //               </div>
    //             </a>
    //           </div>
    //         </div>
    //       </div>

    //       <!-- Right Content - Interactive Map Preview -->
    //       <div class="relative lg:h-auto flex items-center justify-center" style="min-height: 600px;">
    //         <!-- Glow Effect -->
    //         <div class="absolute inset-0 rounded-full" style="background: linear-gradient(to right, rgba(59,130,246,0.2), rgba(34,211,238,0.2)); filter: blur(80px);"></div>
            
    //         <!-- Main Card -->
    //         <div class="relative w-full max-w-lg" style="aspect-ratio: 1;">
    //           <!-- Map Container -->
    //           <div class="absolute inset-0 rounded-3xl bg-slate-800 bg-opacity-50 border border-slate-700 border-opacity-50 overflow-hidden shadow-2xl" style="backdrop-filter: blur(16px);">
    //             <!-- Fake Map Background -->
    //             <div class="absolute inset-0" style="background: linear-gradient(to bottom right, #1e293b, #0f172a);">
    //               <!-- Map Grid -->
    //               <div class="absolute inset-0" style="background-image: linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px); background-size: 30px 30px;"></div>
                  
    //               <!-- Indonesia Map Silhouette (simplified) -->
    //               <svg class="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300" fill="none">
    //                 <path d="M50 150 Q100 120 150 140 T250 130 T350 150 Q380 160 350 180 T250 190 T150 180 T50 170 Z" fill="currentColor" class="text-blue-400"/>
    //               </svg>
    //             </div>

    //             <!-- Tracking Points -->
    //             <div class="absolute" style="top: 25%; left: 25%;">
    //               <div class="relative">
    //                 <div class="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
    //                 <div class="relative w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
    //               </div>
    //               <div class="absolute top-6 left-6 bg-slate-900 bg-opacity-90 rounded-lg px-3 py-2 text-xs text-white border border-slate-700 whitespace-nowrap" style="backdrop-filter: blur(4px);">
    //                 <div class="font-semibold text-green-400">Truk A - B 1234 XY</div>
    //                 <div class="text-slate-400">Jakarta → Surabaya</div>
    //               </div>
    //             </div>

    //             <div class="absolute" style="top: 50%; right: 25%;">
    //               <div class="relative">
    //                 <div class="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75" style="animation-delay: 0.5s;"></div>
    //                 <div class="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
    //               </div>
    //               <div class="absolute top-6 bg-slate-900 bg-opacity-90 rounded-lg px-3 py-2 text-xs text-white border border-slate-700 whitespace-nowrap" style="left: -80px; backdrop-filter: blur(4px);">
    //                 <div class="font-semibold text-blue-400">Motor B - D 5678 AB</div>
    //                 <div class="text-slate-400">Bandung • 45 km/h</div>
    //               </div>
    //             </div>

    //             <div class="absolute" style="bottom: 33%; left: 50%;">
    //               <div class="relative">
    //                 <div class="absolute inset-0 w-4 h-4 bg-cyan-500 rounded-full animate-ping opacity-75" style="animation-delay: 1s;"></div>
    //                 <div class="relative w-4 h-4 bg-cyan-500 rounded-full border-2 border-white shadow-lg"></div>
    //               </div>
    //             </div>

    //             <!-- Route Lines -->
    //             <svg class="absolute inset-0 w-full h-full pointer-events-none">
    //               <defs>
    //                 <linearGradient id="routeGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
    //                   <stop offset="0%" stop-color="#22C55E" stop-opacity="0.8"/>
    //                   <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.8"/>
    //                 </linearGradient>
    //               </defs>
    //               <path d="M100 100 Q200 80 250 200 T350 250" stroke="url(#routeGradient2)" stroke-width="2" stroke-dasharray="8 4" fill="none" class="animate-pulse"/>
    //             </svg>

    //             <!-- Status Bar -->
    //             <div class="absolute bottom-0 left-0 right-0 bg-slate-900 bg-opacity-80 border-t border-slate-700 border-opacity-50 p-4" style="backdrop-filter: blur(4px);">
    //               <div class="flex items-center justify-between text-sm">
    //                 <div class="flex items-center gap-4">
    //                   <div class="flex items-center gap-2">
    //                     <div class="w-2 h-2 bg-green-500 rounded-full"></div>
    //                     <span class="text-slate-400">Online: <span class="text-white font-semibold">127</span></span>
    //                   </div>
    //                   <div class="flex items-center gap-2">
    //                     <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
    //                     <span class="text-slate-400">Idle: <span class="text-white font-semibold">23</span></span>
    //                   </div>
    //                 </div>
    //                 <div class="text-slate-400">
    //                   Update: <span class="text-cyan-400 font-mono">Real-time</span>
    //                 </div>
    //               </div>
    //             </div>
    //           </div>

    //           <!-- Floating Stats Cards -->
    //           <div class="absolute -top-4 -right-4 bg-slate-800 bg-opacity-90 rounded-2xl p-4 border border-slate-700 border-opacity-50 shadow-xl" style="backdrop-filter: blur(16px);">
    //             <div class="flex items-center gap-3">
    //               <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(to bottom right, #22c55e, #10b981);">
    //                 <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    //                 </svg>
    //               </div>
    //               <div>
    //                 <div class="text-2xl font-bold text-white">99.9%</div>
    //                 <div class="text-xs text-slate-400">Uptime Server</div>
    //               </div>
    //             </div>
    //           </div>

    //           <div class="absolute -bottom-4 -left-4 bg-slate-800 bg-opacity-90 rounded-2xl p-4 border border-slate-700 border-opacity-50 shadow-xl" style="backdrop-filter: blur(16px);">
    //             <div class="flex items-center gap-3">
    //               <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(to bottom right, #3b82f6, #6366f1);">
    //                 <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    //                 </svg>
    //               </div>
    //               <div>
    //                 <div class="text-2xl font-bold text-white">&lt;1 dtk</div>
    //                 <div class="text-xs text-slate-400">Update Interval</div>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     <!-- Bottom Features Strip -->
    //     <div class="mt-16 lg:mt-24 pt-8 border-t border-slate-800">
    //       <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
    //         <div class="flex items-center gap-3">
    //           <div class="w-12 h-12 rounded-xl bg-blue-500 bg-opacity-10 flex items-center justify-center">
    //             <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    //             </svg>
    //           </div>
    //           <div>
    //             <div class="text-white font-semibold">Real-time Tracking</div>
    //             <div class="text-sm text-slate-400">Lokasi akurat 24/7</div>
    //           </div>
    //         </div>
    //         <div class="flex items-center gap-3">
    //           <div class="w-12 h-12 rounded-xl bg-cyan-500 bg-opacity-10 flex items-center justify-center">
    //             <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    //             </svg>
    //           </div>
    //           <div>
    //             <div class="text-white font-semibold">Laporan Lengkap</div>
    //             <div class="text-sm text-slate-400">Riwayat perjalanan</div>
    //           </div>
    //         </div>
    //         <div class="flex items-center gap-3">
    //           <div class="w-12 h-12 rounded-xl bg-green-500 bg-opacity-10 flex items-center justify-center">
    //             <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    //             </svg>
    //           </div>
    //           <div>
    //             <div class="text-white font-semibold">Notifikasi Instan</div>
    //             <div class="text-sm text-slate-400">Alert via SMS & App</div>
    //           </div>
    //         </div>
    //         <div class="flex items-center gap-3">
    //           <div class="w-12 h-12 rounded-xl bg-purple-500 bg-opacity-10 flex items-center justify-center">
    //             <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    //             </svg>
    //           </div>
    //           <div>
    //             <div class="text-white font-semibold">Keamanan Terjamin</div>
    //             <div class="text-sm text-slate-400">Enkripsi data end-to-end</div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>

    //   <!-- Scroll Indicator -->
    //   <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
    //     <span class="text-xs text-slate-500 uppercase tracking-widest">Scroll</span>
    //     <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    //     </svg>
    //   </div>
    // </section>
    //         `,
    //     });

    //     blockManager.add('wl-stats', {
    //         label: 'WL Stats',
    //         category: 'WelcomeLanding',
    //         content: `
    //             <section style="padding: 64px 0; background: white;">
    //                 <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
    //                     <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 48px; background: #f8fafc; border-radius: 40px; padding: 48px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    //                         <div style="text-align: center;">
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: #3b82f6; margin: 0;">99.9%</p>
    //                             <p style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Uptime Server</p>
    //                         </div>
    //                         <div style="text-align: center;">
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: #3b82f6; margin: 0;">120+</p>
    //                             <p style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Kota Terjangkau</p>
    //                         </div>
    //                         <div style="text-align: center;">
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: #3b82f6; margin: 0;">&lt;1 dtk</p>
    //                             <p style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Sinkronisasi Cepat</p>
    //                         </div>
    //                         <div style="text-align: center;">
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: #3b82f6; margin: 0;">24/7</p>
    //                             <p style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Siap Melayani</p>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </section>
    //         `,
    //     });

    //     blockManager.add('wl-features', {
    //         label: 'WL Features',
    //         category: 'WelcomeLanding',
    //         content: `
    //             <section style="padding: 128px 0; background: #f8fafc;" id="features">
    //                 <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
    //                     <div style="text-align: center; margin-bottom: 96px;">
    //                         <h2 style="font-size: 1.125rem; font-weight: 900; color: #f97316; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Fitur Unggulan</h2>
    //                         <p style="font-size: 2.5rem; font-weight: 900; color: #0f172a; margin-bottom: 24px;">Semua yang Anda butuhkan untuk tetap terhubung</p>
    //                         <p style="max-width: 672px; margin: 0 auto; font-size: 1.25rem; color: #64748b;">Alat sederhana dan canggih yang dirancang untuk keluarga, pecinta hewan peliharaan, dan tim yang berkembang.</p>
    //                     </div>
                        
    //                     <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;">
    //                         <!-- Feature 1 -->
    //                         <div style="padding: 40px; border-radius: 24px; background: white; border: 1px solid #f1f5f9; transition: all 0.3s;">
    //                             <div style="margin-bottom: 32px; display: inline-block; padding: 16px; border-radius: 16px; background: rgba(59,130,246,0.1);">
    //                                 <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
    //                                 </svg>
    //                             </div>
    //                             <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 16px;">Tampilan Real-Time</h3>
    //                             <p style="color: #64748b; font-size: 1.125rem; line-height: 1.75;">Pantau pergerakan secara real-time dengan pembaruan setiap detik. Jangan lewatkan setiap momen dari aset berharga Anda.</p>
    //                         </div>
                            
    //                         <!-- Feature 2 -->
    //                         <div style="padding: 40px; border-radius: 24px; background: white; border: 1px solid #f1f5f9; transition: all 0.3s;">
    //                             <div style="margin-bottom: 32px; display: inline-block; padding: 16px; border-radius: 16px; background: rgba(249,115,22,0.1);">
    //                                 <svg style="width: 40px; height: 40px; color: #f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
    //                                 </svg>
    //                             </div>
    //                             <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 16px;">Notifikasi Cerdas</h3>
    //                             <p style="color: #64748b; font-size: 1.125rem; line-height: 1.75;">Tetap terinformasi dengan notifikasi saat target tercapai atau batas wilayah dilanggar. Keamanan yang ramah pengguna.</p>
    //                         </div>
                            
    //                         <!-- Feature 3 -->
    //                         <div style="padding: 40px; border-radius: 24px; background: white; border: 1px solid #f1f5f9; transition: all 0.3s;">
    //                             <div style="margin-bottom: 32px; display: inline-block; padding: 16px; border-radius: 16px; background: rgba(59,130,246,0.1);">
    //                                 <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
    //                                 </svg>
    //                             </div>
    //                             <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 16px;">Riwayat Perjalanan</h3>
    //                             <p style="color: #64748b; font-size: 1.125rem; line-height: 1.75;">Lihat kembali perjalanan terbaik Anda dengan ringkasan rute yang indah dan peta aktivitas yang menceritakan kisah Anda.</p>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </section>
    //         `,
    //     });

    //     blockManager.add('wl-resources', {
    //         label: 'WL Resources',
    //         category: 'WelcomeLanding',
    //         content: `
    //             <section style="padding: 96px 0; background: white;" id="resources">
    //                 <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
    //                     <!-- Section Header -->
    //                     <div style="text-align: center; margin-bottom: 64px;">
    //                         <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; padding: 8px 16px; font-size: 14px; font-weight: 600; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; margin-bottom: 24px;">
    //                             <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
    //                             </svg>
    //                             Sumber Daya
    //                         </div>
    //                         <h2 style="font-size: 2.5rem; font-weight: 900; color: #0f172a; margin-bottom: 24px;">
    //                             Semua yang Anda Butuhkan untuk
    //                             <span style="background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sukses</span>
    //                         </h2>
    //                         <p style="font-size: 1.25rem; color: #475569; max-width: 768px; margin: 0 auto; line-height: 1.75;">
    //                             Akses berbagai sumber daya untuk membantu Anda memaksimalkan penggunaan Sky Track.
    //                             Dari panduan pemula hingga dokumentasi teknis lengkap.
    //                         </p>
    //                     </div>

    //                     <!-- Resources Grid -->
    //                     <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; max-width: 896px; margin: 0 auto;">
    //                         <!-- Resource 1 -->
    //                         <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; transition: all 0.3s;">
    //                             <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
    //                                 <svg style="width: 28px; height: 28px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
    //                                 </svg>
    //                             </div>
    //                             <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Panduan Pengguna</h3>
    //                             <p style="color: #475569; margin-bottom: 24px; line-height: 1.75;">Pelajari cara menggunakan Sky Track dari dasar hingga fitur lanjutan dengan panduan lengkap kami.</p>
    //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #3b82f6; text-decoration: none;">
    //                                 Baca Panduan
    //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    //                                 </svg>
    //                             </a>
    //                         </div>

    //                         <!-- Resource 2 -->
    //                         <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; transition: all 0.3s;">
    //                             <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(34,197,94,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
    //                                 <svg style="width: 28px; height: 28px; color: #22c55e;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                 </svg>
    //                             </div>
    //                             <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Video Tutorial</h3>
    //                             <p style="color: #475569; margin-bottom: 24px; line-height: 1.75;">Tonton video tutorial step-by-step untuk memaksimalkan penggunaan platform Sky Track.</p>
    //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #22c55e; text-decoration: none;">
    //                                 Tonton Video
    //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    //                                 </svg>
    //                             </a>
    //                         </div>

    //                         <!-- Resource 3 -->
    //                         <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; transition: all 0.3s;">
    //                             <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(168,85,247,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
    //                                 <svg style="width: 28px; height: 28px; color: #a855f7;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                 </svg>
    //                             </div>
    //                             <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Pusat Bantuan</h3>
    //                             <p style="color: #475569; margin-bottom: 24px; line-height: 1.75;">Temukan jawaban untuk pertanyaan umum dan solusi untuk masalah yang sering dihadapi.</p>
    //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #a855f7; text-decoration: none;">
    //                                 Cari Bantuan
    //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    //                                 </svg>
    //                             </a>
    //                         </div>

    //                         <!-- Resource 4 -->
    //                         <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; transition: all 0.3s;">
    //                             <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(239,68,68,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
    //                                 <svg style="width: 28px; height: 28px; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
    //                                 </svg>
    //                             </div>
    //                             <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Dukungan Teknis</h3>
    //                             <p style="color: #475569; margin-bottom: 24px; line-height: 1.75;">Tim support kami siap membantu Anda 24/7 untuk menyelesaikan masalah teknis.</p>
    //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #ef4444; text-decoration: none;">
    //                                 Hubungi Support
    //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    //                                 </svg>
    //                             </a>
    //                         </div>
    //                     </div>

    //                     <!-- Bottom CTA -->
    //                     <div style="margin-top: 64px; text-align: center;">
    //                         <div style="display: inline-flex; flex-direction: row; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border-radius: 16px; border: 1px solid #e2e8f0;">
    //                             <div style="display: flex; align-items: center; gap: 12px;">
    //                                 <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center;">
    //                                     <svg style="width: 24px; height: 24px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    //                                     </svg>
    //                                 </div>
    //                                 <div style="text-align: left;">
    //                                     <p style="font-weight: 700; color: #0f172a; margin: 0;">Butuh bantuan lebih lanjut?</p>
    //                                     <p style="font-size: 14px; color: #475569; margin: 0;">Tim kami siap membantu Anda</p>
    //                                 </div>
    //                             </div>
    //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: #0f172a; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none;">
    //                                 <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    //                                 </svg>
    //                                 Hubungi Kami
    //                             </a>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </section>
    //         `,
    //     });

    //     blockManager.add('wl-pricing', {
    //         label: 'WL Pricing',
    //         category: 'WelcomeLanding',
    //         content: `
    //             <section style="padding: 128px 0; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);" id="pricing">
    //                 <div style="max-width: 64rem; margin: 0 auto; padding: 0 24px;">
    //                     <!-- Main Trial Card -->
    //                     <div style="position: relative; overflow: hidden; border-radius: 48px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.2); padding: 64px;">
    //                         <!-- Background Glow -->
    //                         <div style="position: absolute; top: 0; right: 0; width: 384px; height: 384px; background: rgba(59,130,246,0.2); border-radius: 50%; filter: blur(100px);"></div>
    //                         <div style="position: absolute; bottom: 0; left: 0; width: 288px; height: 288px; background: rgba(34,211,238,0.2); border-radius: 50%; filter: blur(80px);"></div>
                            
    //                         <div style="position: relative; z-index: 10; text-align: center;">
    //                             <!-- Badge -->
    //                             <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; padding: 10px 20px; font-size: 14px; font-weight: 700; background: linear-gradient(to right, rgba(59,130,246,0.2), rgba(34,211,238,0.2)); color: #67e8f9; border: 1px solid rgba(34,211,238,0.3); margin-bottom: 32px;">
    //                                 <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
    //                                 </svg>
    //                                 Penawaran Terbatas
    //                             </div>
                                
    //                             <!-- Headline -->
    //                             <h2 style="font-size: 3rem; font-weight: 900; color: white; margin-bottom: 24px; line-height: 1.2;">
    //                                 Coba Gratis
    //                                 <span style="background: linear-gradient(to right, #60a5fa, #22d3ee, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">14 Hari</span>
    //                             </h2>
                                
    //                             <p style="font-size: 1.25rem; color: #cbd5e1; margin-bottom: 48px; max-width: 672px; margin-left: auto; margin-right: auto; line-height: 1.75;">
    //                                 Rasakan semua fitur premium tanpa batasan. Tidak perlu kartu kredit, tidak ada komitmen.
    //                                 Batalkan kapan saja.
    //                             </p>
                                
    //                             <!-- Features Grid -->
    //                             <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 48px;">
    //                                 <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
    //                                     <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
    //                                         <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    //                                         </svg>
    //                                     </div>
    //                                     <span style="color: white; font-weight: 600; text-align: left;">Unlimited Perangkat</span>
    //                                 </div>
    //                                 <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
    //                                     <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
    //                                         <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    //                                         </svg>
    //                                     </div>
    //                                     <span style="color: white; font-weight: 600; text-align: left;">Tracking Real-time</span>
    //                                 </div>
    //                                 <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
    //                                     <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
    //                                         <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                         </svg>
    //                                     </div>
    //                                     <span style="color: white; font-weight: 600; text-align: left;">Riwayat Lengkap</span>
    //                                 </div>
    //                                 <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
    //                                     <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
    //                                         <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
    //                                         </svg>
    //                                     </div>
    //                                     <span style="color: white; font-weight: 600; text-align: left;">Dukungan 24/7</span>
    //                                 </div>
    //                             </div>
                                
    //                             <!-- CTA Buttons -->
    //                             <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 48px;">
    //                                 <a href="#" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 20px 40px; border-radius: 9999px; font-weight: 900; font-size: 1.125rem; text-decoration: none; box-shadow: 0 8px 30px rgba(59,130,246,0.4);">
    //                                     <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    //                                     </svg>
    //                                     Mulai Trial Gratis
    //                                     <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
    //                                     </svg>
    //                                 </a>
    //                                 <a href="#features" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); color: white; padding: 20px 40px; border-radius: 9999px; font-weight: 700; font-size: 1.125rem; border: 1px solid rgba(255,255,255,0.2); text-decoration: none;">
    //                                     <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                     </svg>
    //                                     Pelajari Lebih Lanjut
    //                                 </a>
    //                             </div>
                                
    //                             <!-- Trust Indicators -->
    //                             <div style="display: flex; align-items: center; justify-content: center; gap: 24px; font-size: 14px; color: #94a3b8;">
    //                                 <div style="display: flex; align-items: center; gap: 8px;">
    //                                     <svg style="width: 20px; height: 20px; color: #4ade80;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                     </svg>
    //                                     <span>Tanpa kartu kredit</span>
    //                                 </div>
    //                                 <div style="width: 1px; height: 16px; background: #475569;"></div>
    //                                 <div style="display: flex; align-items: center; gap: 8px;">
    //                                     <svg style="width: 20px; height: 20px; color: #4ade80;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                     </svg>
    //                                     <span>Setup dalam 5 menit</span>
    //                                 </div>
    //                                 <div style="width: 1px; height: 16px; background: #475569;"></div>
    //                                 <div style="display: flex; align-items: center; gap: 8px;">
    //                                     <svg style="width: 20px; height: 20px; color: #4ade80;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                     </svg>
    //                                     <span>Batalkan kapan saja</span>
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     </div>
                        
    //                     <!-- Bottom Stats -->
    //                     <div style="margin-top: 64px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center;">
    //                         <div>
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: white; margin: 0;">10,000+</p>
    //                             <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Pengguna Aktif</p>
    //                         </div>
    //                         <div>
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: white; margin: 0;">4.9/5</p>
    //                             <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Rating Pengguna</p>
    //                         </div>
    //                         <div>
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: white; margin: 0;">99.9%</p>
    //                             <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Uptime Server</p>
    //                         </div>
    //                         <div>
    //                             <p style="font-size: 2.25rem; font-weight: 900; color: white; margin: 0;">24/7</p>
    //                             <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Dukungan Teknis</p>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </section>
    //         `,
    //     });

    //     blockManager.add('wl-cta', {
    //         label: 'WL CTA',
    //         category: 'WelcomeLanding',
    //         content: `
    //             <section style="padding: 128px 0; position: relative; overflow: hidden;">
    //                 <div style="position: absolute; inset: 0; background: rgba(59,130,246,0.05);"></div>
    //                 <div style="max-width: 56rem; margin: 0 auto; padding: 0 24px; text-align: center; position: relative; z-index: 10;">
    //                     <h2 style="font-size: 3rem; font-weight: 900; color: #0f172a; margin-bottom: 32px;">Siap Memulai Perjalanan Anda?</h2>
    //                     <p style="font-size: 1.5rem; color: #475569; margin-bottom: 48px; line-height: 1.75;">
    //                         Bergabunglah dengan ribuan keluarga dan bisnis yang menemukan ketenangan pikiran dengan teknologi GPS kami yang canggih dan mudah digunakan.
    //                     </p>
    //                     <div style="display: flex; justify-content: center; gap: 24px;">
    //                         <a href="#" style="background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 20px 48px; border-radius: 9999px; font-weight: 900; font-size: 1.25rem; text-decoration: none; box-shadow: 0 8px 30px rgba(59,130,246,0.4);">
    //                             Mulai Sekarang!
    //                         </a>
    //                         <a href="#" style="background: white; border: 2px solid #e2e8f0; color: #475569; padding: 20px 48px; border-radius: 9999px; font-weight: 900; font-size: 1.25rem; text-decoration: none;">
    //                             Hubungi Tim Kami
    //                         </a>
    //                     </div>
    //                 </div>
    //             </section>
    //         `,
    //     });

    //     blockManager.add('wl-footer', {
    //         label: 'WL Footer',
    //         category: 'WelcomeLanding',
    //         content: `
    //             <footer style="background: #0f172a; color: white; padding: 96px 0 48px; border-radius: 48px 48px 0 0; margin-top: 48px;">
    //                 <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
    //                     <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 80px;">
    //                         <!-- Brand Column -->
    //                         <div>
    //                             <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 32px;">
    //                                 <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    //                                 </svg>
    //                                 <span style="font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em;">Sky Track</span>
    //                             </div>
    //                             <p style="color: #94a3b8; font-size: 1.125rem; max-width: 320px; line-height: 1.75;">
    //                                 Platform GPS tracking paling canggih di Indonesia. Membuat pelacakan menjadi mudah dan keamanan menjadi sederhana untuk semua orang.
    //                             </p>
    //                         </div>
                            
    //                         <!-- Learn Column -->
    //                         <div>
    //                             <h4 style="color: white; font-weight: 900; font-size: 1.25rem; margin-bottom: 24px;">Pelajari</h4>
    //                             <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #94a3b8;">
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Panduan Memulai</a></li>
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Dokumentasi API</a></li>
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Pusat Bantuan</a></li>
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Komunitas</a></li>
    //                             </ul>
    //                         </div>
                            
    //                         <!-- Contact Column -->
    //                         <div>
    //                             <h4 style="color: white; font-weight: 900; font-size: 1.25rem; margin-bottom: 24px;">Kontak</h4>
    //                             <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #94a3b8;">
    //                                 <li style="display: flex; align-items: center; gap: 8px;">
    //                                     <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
    //                                     </svg>
    //                                     +62 812 3456 7890
    //                                 </li>
    //                                 <li style="display: flex; align-items: center; gap: 8px;">
    //                                     <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    //                                     </svg>
    //                                     <a style="color: #94a3b8; text-decoration: none;" href="mailto:info@skytrack.id">info@skytrack.id</a>
    //                                 </li>
    //                                 <li style="display: flex; align-items: center; gap: 8px;">
    //                                     <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    //                                     </svg>
    //                                     Senin - Jumat, 09:00 - 17:00
    //                                 </li>
    //                             </ul>
    //                         </div>
                            
    //                         <!-- Legal Column -->
    //                         <div>
    //                             <h4 style="color: white; font-weight: 900; font-size: 1.25rem; margin-bottom: 24px;">Legal</h4>
    //                             <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #94a3b8;">
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Kebijakan Privasi</a></li>
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Syarat & Ketentuan</a></li>
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Kebijakan Cookie</a></li>
    //                                 <li><a style="color: #94a3b8; text-decoration: none;" href="#">Keamanan</a></li>
    //                             </ul>
    //                         </div>
    //                     </div>
                        
    //                     <!-- Bottom Section -->
    //                     <div style="border-top: 1px solid #1e293b; padding-top: 48px; display: flex; justify-content: space-between; align-items: center;">
    //                         <p style="font-size: 14px; color: #64748b; margin: 0;">© 2024 Sky Track. All rights reserved.</p>
    //                         <div style="display: flex; gap: 32px;">
    //                             <a style="color: #64748b; text-decoration: none;" href="#">
    //                                 <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 24 24">
    //                                     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    //                                 </svg>
    //                             </a>
    //                             <a style="color: #64748b; text-decoration: none;" href="#">
    //                                 <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 24 24">
    //                                     <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    //                                 </svg>
    //                             </a>
    //                             <a style="color: #64748b; text-decoration: none;" href="#">
    //                                 <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 24 24">
    //                                     <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    //                                 </svg>
    //                             </a>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </footer>
    //         `,
    //     });

        // ==========================================
        // WelcomeLanding Section Components
        // ==========================================

        blockManager.add('wl-hero', {
            label: 'WL Hero',
            category: 'WelcomeLanding',
            content: `
<section class="relative min-h-screen overflow-hidden" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%);">
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden">
    <!-- Grid Pattern -->
    <div class="absolute inset-0" style="background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 60px 60px;"></div>
    
    <!-- Floating Orbs -->
    <div class="absolute" style="top: 80px; left: 40px; width: 288px; height: 288px; background: rgba(59,130,246,0.2); border-radius: 50%; filter: blur(100px);"></div>
    <div class="absolute" style="bottom: 80px; right: 40px; width: 384px; height: 384px; background: rgba(34,211,238,0.2); border-radius: 50%; filter: blur(120px);"></div>
    <div class="absolute" style="top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: rgba(99,102,241,0.1); border-radius: 50%; filter: blur(150px);"></div>
    
    <!-- Animated Lines -->
    <div class="absolute" style="top: 0; left: 25%; width: 1px; height: 100%; background: linear-gradient(to bottom, transparent, rgba(59,130,246,0.2), transparent);"></div>
    <div class="absolute" style="top: 0; right: 25%; width: 1px; height: 100%; background: linear-gradient(to bottom, transparent, rgba(34,211,238,0.2), transparent);"></div>
  </div>

  <div class="relative" style="max-width: 80rem; margin: 0 auto; padding: 96px 16px 80px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
      <!-- Left Content -->
      <div style="text-align: left; position: relative; z-index: 10;">
        <!-- Badge -->
        <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; padding: 8px 16px; font-size: 14px; font-weight: 600; background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); margin-bottom: 32px; backdrop-filter: blur(4px);">
          <span style="position: relative; display: flex; height: 8px; width: 8px;">
            <span style="position: absolute; display: inline-flex; height: 100%; width: 100%; border-radius: 50%; background: #4ade80; opacity: 0.75;"></span>
            <span style="position: relative; display: inline-flex; border-radius: 50%; height: 8px; width: 8px; background: #22c55e;"></span>
          </span>
          🇮🇩 Solusi GPS Tracking #1 di Indonesia
        </div>

        <!-- Headline -->
        <h1 style="font-size: 4rem; font-weight: 900; letter-spacing: -0.025em; color: white; margin-bottom: 24px; line-height: 1.1;">
          Pantau Aset Anda 
          <span style="position: relative;">
            <span style="background: linear-gradient(to right, #60a5fa, #22d3ee, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              Kapan Saja
            </span>
            <svg style="position: absolute; bottom: -8px; left: 0; width: 100%;" viewBox="0 0 300 12" fill="none">
              <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#gradient-hero)" stroke-width="3" stroke-linecap="round"/>
              <defs>
                <linearGradient id="gradient-hero" x1="0" y1="0" x2="300" y2="0">
                  <stop stop-color="#60A5FA"/>
                  <stop offset="0.5" stop-color="#22D3EE"/>
                  <stop offset="1" stop-color="#2DD4BF"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          <br />
          <span style="color: #cbd5e1;">Dimana Saja</span>
        </h1>

        <!-- Description -->
        <p style="font-size: 1.25rem; color: #94a3b8; margin-bottom: 40px; max-width: 576px; line-height: 1.75;">
          Lindungi kendaraan, armada, dan aset berharga Anda dengan teknologi GPS tracking real-time terdepan. 
          <span style="color: white; font-weight: 500;"> Akurat, handal, dan terpercaya.</span>
        </p>

        <!-- CTA Buttons -->
        <div style="display: flex; flex-direction: row; justify-content: flex-start; gap: 16px; margin-bottom: 48px;">
          <a href="https://app.sky-track.net/#register" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(to right, #3b82f6, #06b6d4); color: white; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 18px; text-decoration: none; box-shadow: 0 10px 25px rgba(59,130,246,0.25);">
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Mulai Tracking Sekarang
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a href="https://app.sky-track.net/#demo" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.05); backdrop-filter: blur(4px); color: white; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 18px; border: 1px solid rgba(255,255,255,0.1); text-decoration: none;">
            <svg style="width: 20px; height: 20px; color: #60a5fa;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Lihat Demo
          </a>
        </div>

        <!-- Trust Indicators -->
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 24px; font-size: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex;">
              <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; background: #334155; margin-right: -8px;" src="https://i.pravatar.cc/100?img=1" alt="User" />
              <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; background: #334155; margin-right: -8px;" src="https://i.pravatar.cc/100?img=2" alt="User" />
              <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; background: #334155; margin-right: -8px;" src="https://i.pravatar.cc/100?img=3" alt="User" />
              <img style="height: 32px; width: 32px; border-radius: 50%; border: 2px solid #1e293b; background: #334155;" src="https://i.pravatar.cc/100?img=4" alt="User" />
            </div>
            <span style="color: #94a3b8;">
              <span style="color: white; font-weight: 600;">10,000+</span> Pengguna Aktif
            </span>
          </div>
          <div style="width: 1px; height: 24px; background: #334155;"></div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <svg style="width: 16px; height: 16px; color: #facc15;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span style="color: #94a3b8; margin-left: 4px;">4.9/5 Rating</span>
          </div>
        </div>
        
        <!-- App Store Badges -->
        <div style="margin-top: 32px; display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 12px;">
          <span style="color: #64748b; font-size: 14px; font-weight: 500;">Tersedia di:</span>
          <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Google Play Store -->
            <a href="#" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px; text-decoration: none;">
              <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.99l-2.302 2.302-8.634-8.634z" fill="white"/>
              </svg>
              <div style="text-align: left;">
                <p style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1; margin: 0;">Dapatkan di</p>
                <p style="color: white; font-weight: 700; font-size: 14px; line-height: 1.2; margin: 0;">Google Play</p>
              </div>
            </a>
            
            <!-- Apple App Store -->
            <a href="#" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px; text-decoration: none;">
              <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div style="text-align: left;">
                <p style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1; margin: 0;">Unduh di</p>
                <p style="color: white; font-weight: 700; font-size: 14px; line-height: 1.2; margin: 0;">App Store</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Right Content - Interactive Map Preview -->
      <div style="position: relative; min-height: 600px; display: flex; align-items: center; justify-content: center;">
        <!-- Glow Effect -->
        <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(59,130,246,0.2), rgba(34,211,238,0.2)); filter: blur(80px); border-radius: 50%;"></div>
        
        <!-- Main Card -->
        <div style="position: relative; width: 100%; max-width: 500px; aspect-ratio: 1;">
          <!-- Map Container -->
          <div style="position: absolute; inset: 0; border-radius: 24px; background: rgba(30,41,59,0.5); backdrop-filter: blur(16px); border: 1px solid rgba(51,65,85,0.5); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
            <!-- Fake Map Background -->
            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom right, #1e293b, #0f172a);">
              <!-- Map Grid -->
              <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px); background-size: 30px 30px;"></div>
              
              <!-- Indonesia Map Silhouette (simplified) -->
              <svg style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.1;" viewBox="0 0 400 300" fill="none">
                <path d="M50 150 Q100 120 150 140 T250 130 T350 150 Q380 160 350 180 T250 190 T150 180 T50 170 Z" fill="currentColor" style="color: #60a5fa;"/>
              </svg>
            </div>

            <!-- Tracking Points -->
            <div style="position: absolute; top: 25%; left: 25%;">
              <div style="position: relative;">
                <div style="width: 16px; height: 16px; background: #22c55e; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
              </div>
              <div style="position: absolute; top: 24px; left: 24px; background: rgba(15,23,42,0.9); backdrop-filter: blur(4px); border-radius: 8px; padding: 8px 12px; font-size: 12px; color: white; border: 1px solid #334155; white-space: nowrap;">
                <div style="font-weight: 600; color: #4ade80;">Truk A - B 1234 XY</div>
                <div style="color: #94a3b8;">Jakarta → Surabaya</div>
              </div>
            </div>

            <div style="position: absolute; top: 50%; right: 25%;">
              <div style="position: relative;">
                <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
              </div>
              <div style="position: absolute; top: 24px; left: -80px; background: rgba(15,23,42,0.9); backdrop-filter: blur(4px); border-radius: 8px; padding: 8px 12px; font-size: 12px; color: white; border: 1px solid #334155; white-space: nowrap;">
                <div style="font-weight: 600; color: #60a5fa;">Motor B - D 5678 AB</div>
                <div style="color: #94a3b8;">Bandung • 45 km/h</div>
              </div>
            </div>

            <div style="position: absolute; bottom: 33%; left: 50%;">
              <div style="position: relative;">
                <div style="width: 16px; height: 16px; background: #06b6d4; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
              </div>
            </div>

            <!-- Route Lines -->
            <svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;">
              <defs>
                <linearGradient id="routeGradientHero" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#22C55E" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.8"/>
                </linearGradient>
              </defs>
              <path d="M100 100 Q200 80 250 200 T350 250" stroke="url(#routeGradientHero)" stroke-width="2" stroke-dasharray="8 4" fill="none"/>
            </svg>

            <!-- Status Bar -->
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15,23,42,0.8); backdrop-filter: blur(4px); border-top: 1px solid rgba(51,65,85,0.5); padding: 16px;">
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 14px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
                    <span style="color: #94a3b8;">Online: <span style="color: white; font-weight: 600;">127</span></span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; background: #eab308; border-radius: 50%;"></div>
                    <span style="color: #94a3b8;">Idle: <span style="color: white; font-weight: 600;">23</span></span>
                  </div>
                </div>
                <div style="color: #94a3b8;">
                  Update: <span style="color: #22d3ee; font-family: monospace;">Real-time</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Floating Stats Cards -->
          <div style="position: absolute; top: -16px; right: -16px; background: rgba(30,41,59,0.9); backdrop-filter: blur(16px); border-radius: 16px; padding: 16px; border: 1px solid rgba(51,65,85,0.5); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(to bottom right, #22c55e, #10b981); display: flex; align-items: center; justify-content: center;">
                <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div style="font-size: 1.5rem; font-weight: 700; color: white;">99.9%</div>
                <div style="font-size: 12px; color: #94a3b8;">Uptime Server</div>
              </div>
            </div>
          </div>

          <div style="position: absolute; bottom: -16px; left: -16px; background: rgba(30,41,59,0.9); backdrop-filter: blur(16px); border-radius: 16px; padding: 16px; border: 1px solid rgba(51,65,85,0.5); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(to bottom right, #3b82f6, #6366f1); display: flex; align-items: center; justify-content: center;">
                <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div style="font-size: 1.5rem; font-weight: 700; color: white;">&lt;1 dtk</div>
                <div style="font-size: 12px; color: #94a3b8;">Update Interval</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Features Strip -->
    <div style="margin-top: 64px; padding-top: 32px; border-top: 1px solid #1e293b;">
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 24px; height: 24px; color: #60a5fa;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div style="color: white; font-weight: 600;">Real-time Tracking</div>
            <div style="font-size: 14px; color: #94a3b8;">Lokasi akurat 24/7</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(34,211,238,0.1); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 24px; height: 24px; color: #22d3ee;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div style="color: white; font-weight: 600;">Laporan Lengkap</div>
            <div style="font-size: 14px; color: #94a3b8;">Riwayat perjalanan</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(34,197,94,0.1); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 24px; height: 24px; color: #4ade80;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <div style="color: white; font-weight: 600;">Notifikasi Instan</div>
            <div style="font-size: 14px; color: #94a3b8;">Alert via SMS & App</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(168,85,247,0.1); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 24px; height: 24px; color: #c084fc;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <div style="color: white; font-weight: 600;">Keamanan Terjamin</div>
            <div style="font-size: 14px; color: #94a3b8;">Enkripsi data end-to-end</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Scroll Indicator -->
  <div style="position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px;">
    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.2em;">Scroll</span>
    <svg style="width: 20px; height: 20px; color: #64748b;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  </div>
</section>
            `,
        });

        // blockManager.add('wl-navbar', {
        //     label: 'WL Navbar',
        //     category: 'WelcomeLanding',
        //     content: `
        //         <header style="position: sticky; top: 0; z-index: 50; width: 100%; border-bottom: 1px solid #f1f5f9; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 16px;">
        //                 <div style="display: flex; justify-content: space-between; align-items: center; height: 80px;">
        //                     <div style="display: flex; align-items: center; gap: 8px;">
        //                         <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="currentColor" viewBox="0 0 24 24">
        //                             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        //                         </svg>
        //                         <span style="font-size: 1.5rem; font-weight: 900; letter-spacing: -0.025em; color: #0f172a;">Sky Track</span>
        //                     </div>
                            
        //                     <nav style="display: flex; gap: 40px;">
        //                         <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="#features">Fitur</a>
        //                         <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="#resources">Sumber Daya</a>
        //                         <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="#pricing">Harga</a>
        //                     </nav>
                            
        //                     <div style="display: flex; align-items: center; gap: 24px;">
        //                         <a style="font-size: 1rem; font-weight: 600; color: #475569; text-decoration: none;" href="/login">Masuk</a>
        //                         <a style="background: #3b82f6; color: white; padding: 10px 24px; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; text-decoration: none; box-shadow: 0 4px 14px rgba(59,130,246,0.4);" href="#">
        //                             Daftar Sekarang
        //                         </a>
        //                     </div>
        //                 </div>
        //             </div>
        //         </header>
        //     `,
        // });



        // blockManager.add('wl-features', {
        //     label: 'WL Features',
        //     category: 'WelcomeLanding',
        //     content: `
        //         <section style="padding: 128px 0; background: #f8fafc;" id="features">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <div style="text-align: center; margin-bottom: 96px;">
        //                     <h2 style="font-size: 1.125rem; font-weight: 900; color: #f97316; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Fitur Unggulan</h2>
        //                     <p style="font-size: 2.5rem; font-weight: 900; color: #0f172a; margin-bottom: 24px;">Semua yang Anda butuhkan untuk tetap terhubung</p>
        //                     <p style="max-width: 672px; margin: 0 auto; font-size: 1.25rem; color: #64748b;">Alat sederhana dan canggih yang dirancang untuk keluarga, pecinta hewan peliharaan, dan tim yang berkembang.</p>
        //                 </div>
                        
        //                 <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;">
        //                     <!-- Feature 1 -->
        //                     <div style="padding: 40px; border-radius: 24px; background: white; border: 1px solid #f1f5f9; transition: all 0.3s;">
        //                         <div style="margin-bottom: 32px; display: inline-block; padding: 16px; border-radius: 16px; background: rgba(59,130,246,0.1);">
        //                             <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 16px;">Tampilan Real-Time</h3>
        //                         <p style="color: #64748b; font-size: 1.125rem; line-height: 1.7;">Pantau pergerakan secara real-time dengan pembaruan setiap detik. Jangan lewatkan setiap momen dari aset berharga Anda.</p>
        //                     </div>
                            
        //                     <!-- Feature 2 -->
        //                     <div style="padding: 40px; border-radius: 24px; background: white; border: 1px solid #f1f5f9; transition: all 0.3s;">
        //                         <div style="margin-bottom: 32px; display: inline-block; padding: 16px; border-radius: 16px; background: rgba(249,115,22,0.1);">
        //                             <svg style="width: 40px; height: 40px; color: #f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 16px;">Notifikasi Cerdas</h3>
        //                         <p style="color: #64748b; font-size: 1.125rem; line-height: 1.7;">Tetap terinformasi dengan notifikasi saat target tercapai atau batas wilayah dilanggar. Keamanan yang ramah pengguna.</p>
        //                     </div>
                            
        //                     <!-- Feature 3 -->
        //                     <div style="padding: 40px; border-radius: 24px; background: white; border: 1px solid #f1f5f9; transition: all 0.3s;">
        //                         <div style="margin-bottom: 32px; display: inline-block; padding: 16px; border-radius: 16px; background: rgba(59,130,246,0.1);">
        //                             <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 16px;">Riwayat Perjalanan</h3>
        //                         <p style="color: #64748b; font-size: 1.125rem; line-height: 1.7;">Lihat kembali perjalanan terbaik Anda dengan ringkasan rute yang indah dan peta aktivitas yang menceritakan kisah Anda.</p>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('wl-resources', {
        //     label: 'WL Resources',
        //     category: 'WelcomeLanding',
        //     content: `
        //         <section style="padding: 96px 0; background: white;" id="resources">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <!-- Section Header -->
        //                 <div style="text-align: center; margin-bottom: 64px;">
        //                     <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; padding: 8px 16px; font-size: 14px; font-weight: 600; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        //                         <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        //                         </svg>
        //                         Sumber Daya
        //                     </div>
        //                     <h2 style="font-size: 2.5rem; font-weight: 900; color: #0f172a; margin-bottom: 24px;">
        //                         Semua yang Anda Butuhkan untuk <span style="background: linear-gradient(to right, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sukses</span>
        //                     </h2>
        //                     <p style="font-size: 1.25rem; color: #64748b; max-width: 768px; margin: 0 auto; line-height: 1.7;">
        //                         Akses berbagai sumber daya untuk membantu Anda memaksimalkan penggunaan Sky Track. Dari panduan pemula hingga dokumentasi teknis lengkap.
        //                     </p>
        //                 </div>

        //                 <!-- Resources Grid -->
        //                 <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; max-width: 896px; margin: 0 auto;">
        //                     <!-- Resource 1 -->
        //                     <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        //                         <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
        //                             <svg style="width: 28px; height: 28px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Panduan Pengguna</h3>
        //                         <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">Pelajari cara menggunakan Sky Track dari dasar hingga fitur lanjutan dengan panduan lengkap kami.</p>
        //                         <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #3b82f6; text-decoration: none;">
        //                             Baca Panduan
        //                             <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        //                             </svg>
        //                         </a>
        //                     </div>

        //                     <!-- Resource 2 -->
        //                     <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        //                         <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(34,197,94,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
        //                             <svg style="width: 28px; height: 28px; color: #22c55e;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Video Tutorial</h3>
        //                         <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">Tonton video tutorial step-by-step untuk memaksimalkan penggunaan platform Sky Track.</p>
        //                         <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #22c55e; text-decoration: none;">
        //                             Tonton Video
        //                             <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        //                             </svg>
        //                         </a>
        //                     </div>

        //                     <!-- Resource 3 -->
        //                     <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        //                         <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(168,85,247,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
        //                             <svg style="width: 28px; height: 28px; color: #a855f7;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Pusat Bantuan</h3>
        //                         <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">Temukan jawaban untuk pertanyaan umum dan solusi untuk masalah yang sering dihadapi.</p>
        //                         <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #a855f7; text-decoration: none;">
        //                             Cari Bantuan
        //                             <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        //                             </svg>
        //                         </a>
        //                     </div>

        //                     <!-- Resource 4 -->
        //                     <div style="position: relative; background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        //                         <div style="width: 56px; height: 56px; border-radius: 12px; background: rgba(239,68,68,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
        //                             <svg style="width: 28px; height: 28px; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
        //                             </svg>
        //                         </div>
        //                         <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Dukungan Teknis</h3>
        //                         <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">Tim support kami siap membantu Anda 24/7 untuk menyelesaikan masalah teknis.</p>
        //                         <a href="#" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #ef4444; text-decoration: none;">
        //                             Hubungi Support
        //                             <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        //                             </svg>
        //                         </a>
        //                     </div>
        //                 </div>

        //                 <!-- Bottom CTA -->
        //                 <div style="margin-top: 64px; text-align: center;">
        //                     <div style="display: inline-flex; flex-direction: row; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border-radius: 16px; border: 1px solid #e2e8f0;">
        //                         <div style="display: flex; align-items: center; gap: 12px;">
        //                             <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center;">
        //                                 <svg style="width: 24px; height: 24px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
        //                                 </svg>
        //                             </div>
        //                             <div style="text-align: left;">
        //                                 <p style="font-weight: 700; color: #0f172a; margin: 0;">Butuh bantuan lebih lanjut?</p>
        //                                 <p style="font-size: 14px; color: #64748b; margin: 0;">Tim kami siap membantu Anda</p>
        //                             </div>
        //                         </div>
        //                         <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: #0f172a; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none;">
        //                             <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        //                             </svg>
        //                             Hubungi Kami
        //                         </a>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('wl-pricing', {
        //     label: 'WL Pricing',
        //     category: 'WelcomeLanding',
        //     content: `
        //         <section style="padding: 128px 0; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%);" id="pricing">
        //             <div style="max-width: 64rem; margin: 0 auto; padding: 0 24px;">
        //                 <!-- Main Trial Card -->
        //                 <div style="position: relative; overflow: hidden; border-radius: 48px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.2); padding: 64px;">
        //                     <!-- Background Glow -->
        //                     <div style="position: absolute; top: 0; right: 0; width: 384px; height: 384px; background: rgba(59,130,246,0.2); border-radius: 50%; filter: blur(100px);"></div>
        //                     <div style="position: absolute; bottom: 0; left: 0; width: 288px; height: 288px; background: rgba(34,211,238,0.2); border-radius: 50%; filter: blur(80px);"></div>
                            
        //                     <div style="position: relative; z-index: 10; text-align: center;">
        //                         <!-- Badge -->
        //                         <div style="display: inline-flex; align-items: center; gap: 8px; border-radius: 9999px; padding: 8px 20px; font-size: 14px; font-weight: 700; background: linear-gradient(to right, rgba(59,130,246,0.2), rgba(34,211,238,0.2)); color: #67e8f9; border: 1px solid rgba(34,211,238,0.3); margin-bottom: 32px;">
        //                             <svg style="width: 18px; height: 18px;" fill="currentColor" viewBox="0 0 20 20">
        //                                 <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        //                             </svg>
        //                             Penawaran Terbatas
        //                         </div>
                                
        //                         <!-- Headline -->
        //                         <h2 style="font-size: 3rem; font-weight: 900; color: white; margin-bottom: 24px; line-height: 1.1;">
        //                             Coba Gratis <span style="background: linear-gradient(to right, #60a5fa, #22d3ee, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">14 Hari</span>
        //                         </h2>
                                
        //                         <p style="font-size: 1.25rem; color: #cbd5e1; margin-bottom: 48px; max-width: 672px; margin-left: auto; margin-right: auto; line-height: 1.7;">
        //                             Rasakan semua fitur premium tanpa batasan. Tidak perlu kartu kredit, tidak ada komitmen. Batalkan kapan saja.
        //                         </p>
                                
        //                         <!-- Features Grid -->
        //                         <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 48px;">
        //                             <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
        //                                 <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                     <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        //                                     </svg>
        //                                 </div>
        //                                 <span style="color: white; font-weight: 600; text-align: left;">Unlimited Perangkat</span>
        //                             </div>
        //                             <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
        //                                 <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                     <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        //                                     </svg>
        //                                 </div>
        //                                 <span style="color: white; font-weight: 600; text-align: left;">Tracking Real-time</span>
        //                             </div>
        //                             <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
        //                                 <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                     <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        //                                     </svg>
        //                                 </div>
        //                                 <span style="color: white; font-weight: 600; text-align: left;">Riwayat Lengkap</span>
        //                             </div>
        //                             <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
        //                                 <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        //                                     <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
        //                                     </svg>
        //                                 </div>
        //                                 <span style="color: white; font-weight: 600; text-align: left;">Dukungan 24/7</span>
        //                             </div>
        //                         </div>
                                
        //                         <!-- CTA Buttons -->
        //                         <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 48px;">
        //                             <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(to right, #3b82f6, #06b6d4); color: white; padding: 20px 40px; border-radius: 9999px; font-weight: 900; font-size: 1.125rem; text-decoration: none; box-shadow: 0 8px 30px rgba(59,130,246,0.25);">
        //                                 <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        //                                 </svg>
        //                                 Mulai Trial Gratis
        //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        //                                 </svg>
        //                             </a>
        //                             <a href="#features" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); color: white; padding: 20px 40px; border-radius: 9999px; font-weight: 700; font-size: 1.125rem; border: 1px solid rgba(255,255,255,0.2); text-decoration: none;">
        //                                 <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        //                                 </svg>
        //                                 Pelajari Lebih Lanjut
        //                             </a>
        //                         </div>
                                
        //                         <!-- Trust Indicators -->
        //                         <div style="display: flex; align-items: center; justify-content: center; gap: 24px; font-size: 14px; color: #94a3b8;">
        //                             <div style="display: flex; align-items: center; gap: 8px;">
        //                                 <svg style="width: 16px; height: 16px; color: #4ade80;" fill="currentColor" viewBox="0 0 20 20">
        //                                     <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        //                                 </svg>
        //                                 <span>Tanpa kartu kredit</span>
        //                             </div>
        //                             <div style="width: 1px; height: 16px; background: #475569;"></div>
        //                             <div style="display: flex; align-items: center; gap: 8px;">
        //                                 <svg style="width: 16px; height: 16px; color: #4ade80;" fill="currentColor" viewBox="0 0 20 20">
        //                                     <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        //                                 </svg>
        //                                 <span>Setup dalam 5 menit</span>
        //                             </div>
        //                             <div style="width: 1px; height: 16px; background: #475569;"></div>
        //                             <div style="display: flex; align-items: center; gap: 8px;">
        //                                 <svg style="width: 16px; height: 16px; color: #4ade80;" fill="currentColor" viewBox="0 0 20 20">
        //                                     <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        //                                 </svg>
        //                                 <span>Batalkan kapan saja</span>
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
                        
        //                 <!-- Bottom Stats -->
        //                 <div style="margin-top: 64px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center;">
        //                     <div>
        //                         <p style="font-size: 2.5rem; font-weight: 900; color: white; margin: 0;">10,000+</p>
        //                         <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Pengguna Aktif</p>
        //                     </div>
        //                     <div>
        //                         <p style="font-size: 2.5rem; font-weight: 900; color: white; margin: 0;">4.9/5</p>
        //                         <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Rating Pengguna</p>
        //                     </div>
        //                     <div>
        //                         <p style="font-size: 2.5rem; font-weight: 900; color: white; margin: 0;">99.9%</p>
        //                         <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Uptime Server</p>
        //                     </div>
        //                     <div>
        //                         <p style="font-size: 2.5rem; font-weight: 900; color: white; margin: 0;">24/7</p>
        //                         <p style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">Dukungan Teknis</p>
        //                     </div>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('wl-cta', {
        //     label: 'WL CTA',
        //     category: 'WelcomeLanding',
        //     content: `
        //         <section style="padding: 128px 0; position: relative; overflow: hidden;">
        //             <div style="position: absolute; inset: 0; background: rgba(59,130,246,0.05);"></div>
        //             <div style="max-width: 56rem; margin: 0 auto; padding: 0 24px; text-align: center; position: relative; z-index: 10;">
        //                 <h2 style="font-size: 3rem; font-weight: 900; color: #0f172a; margin-bottom: 32px;">Siap Memulai Perjalanan Anda?</h2>
        //                 <p style="font-size: 1.5rem; color: #64748b; margin-bottom: 48px; line-height: 1.7;">
        //                     Bergabunglah dengan ribuan keluarga dan bisnis yang menemukan ketenangan pikiran dengan teknologi GPS kami yang canggih dan mudah digunakan.
        //                 </p>
        //                 <div style="display: flex; justify-content: center; gap: 24px;">
        //                     <a href="#" style="background: #3b82f6; color: white; padding: 20px 48px; border-radius: 9999px; font-weight: 900; font-size: 1.25rem; text-decoration: none; box-shadow: 0 8px 30px rgba(59,130,246,0.4);">
        //                         Mulai Sekarang!
        //                     </a>
        //                     <a href="#" style="background: white; border: 2px solid #e2e8f0; color: #475569; padding: 20px 48px; border-radius: 9999px; font-weight: 900; font-size: 1.25rem; text-decoration: none;">
        //                         Hubungi Tim Kami
        //                     </a>
        //                 </div>
        //             </div>
        //         </section>
        //     `,
        // });

        // blockManager.add('wl-footer', {
        //     label: 'WL Footer',
        //     category: 'WelcomeLanding',
        //     content: `
        //         <footer style="background: #0f172a; color: white; padding: 96px 0 48px; border-radius: 48px 48px 0 0; margin-top: 48px;">
        //             <div style="max-width: 80rem; margin: 0 auto; padding: 0 24px;">
        //                 <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 80px;">
        //                     <!-- Brand Column -->
        //                     <div>
        //                         <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 32px;">
        //                             <svg style="width: 40px; height: 40px; color: #3b82f6;" fill="currentColor" viewBox="0 0 24 24">
        //                                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        //                             </svg>
        //                             <span style="font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em;">Sky Track</span>
        //                         </div>
        //                         <p style="color: #94a3b8; font-size: 1.125rem; max-width: 320px; line-height: 1.7;">
        //                             The world's most vibrant GPS tracking platform. Making precision fun and security simple for everyone.
        //                         </p>
        //                     </div>
                            
        //                     <!-- Learn Column -->
        //                     <div>
        //                         <h4 style="color: white; font-weight: 900; font-size: 1.25rem; margin-bottom: 24px;">Pelajari</h4>
        //                         <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #94a3b8;">
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Panduan Memulai</a></li>
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Dokumentasi API</a></li>
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Pusat Bantuan</a></li>
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Komunitas</a></li>
        //                         </ul>
        //                     </div>
                            
        //                     <!-- Contact Column -->
        //                     <div>
        //                         <h4 style="color: white; font-weight: 900; font-size: 1.25rem; margin-bottom: 24px;">Kontak</h4>
        //                         <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #94a3b8;">
        //                             <li style="display: flex; align-items: center; gap: 8px;">
        //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
        //                                 </svg>
        //                                 +62 812 3456 7890
        //                             </li>
        //                             <li style="display: flex; align-items: center; gap: 8px;">
        //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        //                                 </svg>
        //                                 <a style="color: #94a3b8; text-decoration: none;" href="mailto:info@skytrack.id">info@skytrack.id</a>
        //                             </li>
        //                             <li style="display: flex; align-items: center; gap: 8px;">
        //                                 <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        //                                 </svg>
        //                                 24/7 Support
        //                             </li>
        //                         </ul>
        //                     </div>
                            
        //                     <!-- Legal Column -->
        //                     <div>
        //                         <h4 style="color: white; font-weight: 900; font-size: 1.25rem; margin-bottom: 24px;">Legal</h4>
        //                         <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #94a3b8;">
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Kebijakan Privasi</a></li>
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Syarat & Ketentuan</a></li>
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Kebijakan Cookie</a></li>
        //                             <li><a style="color: #94a3b8; text-decoration: none;" href="#">Keamanan</a></li>
        //                         </ul>
        //                     </div>
        //                 </div>
                        
        //                 <!-- Bottom Section -->
        //                 <div style="border-top: 1px solid #1e293b; padding-top: 48px; display: flex; justify-content: space-between; align-items: center;">
        //                     <p style="font-size: 14px; color: #64748b; font-weight: 500; margin: 0;">© 2024 Sky Track. All rights reserved.</p>
        //                     <div style="display: flex; gap: 32px;">
        //                         <a style="color: #64748b; text-decoration: none;" href="#">
        //                             <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 24 24">
        //                                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        //                             </svg>
        //                         </a>
        //                         <a style="color: #64748b; text-decoration: none;" href="#">
        //                             <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        //                             </svg>
        //                         </a>
        //                         <a style="color: #64748b; text-decoration: none;" href="#">
        //                             <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
        //                             </svg>
        //                         </a>
        //                     </div>
        //                 </div>
        //             </div>
        //         </footer>
        //     `,
        // });

        // blockManager.add('carousel-component', {
        //     label: 'Carousel',
        //     category: 'Components',
        //     content: `
        //         <div data-gjs-type="carousel-component" class="carousel-wrapper" style="width: 100%; padding: 20px 0;">
        //             <Carousel slug="test-carousel" />
        //         </div>
        //     `,
        //     attributes: { class: 'fa fa-images' },
        // });

        // // Add custom component type for Carousel
        // gjsEditor.DomComponents.addType('carousel-component', {
        //     isComponent: (el: HTMLElement) => el.tagName === 'DIV' && el.classList.contains('carousel-wrapper'),
        //     model: {
        //         defaults: {
        //             tagName: 'div',
        //             droppable: false,
        //             attributes: { class: 'carousel-wrapper' },
        //             traits: [
        //                 {
        //                     type: 'text',
        //                     name: 'slug',
        //                     label: 'Carousel Slug',
        //                     placeholder: 'Enter carousel slug',
        //                 },
        //             ],
        //         },
        //         init() {
        //             this.on('change:attributes:slug', this.updateCarouselSlug);
        //         },
        //         updateCarouselSlug() {
        //             const slug = this.getAttributes().slug || 'test-carousel';
        //             const content = `<Carousel slug="${slug}" />`;
        //             this.components(content);
        //         },
        //     },
        //     view: {
        //         onRender() {
        //             const slug = this.model.getAttributes().slug || 'test-carousel';
        //             this.el.innerHTML = `
        //                 <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 40px; text-align: center; color: white; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        //                     <svg style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.9;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        //                     </svg>
        //                     <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Carousel Component</div>
        //                     <div style="font-size: 14px; opacity: 0.8; font-family: monospace; background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 6px;">
        //                         &lt;Carousel slug="${slug}" /&gt;
        //                     </div>
        //                     <div style="font-size: 12px; margin-top: 12px; opacity: 0.7;">
        //                         This carousel will be rendered dynamically on the frontend
        //                     </div>
        //                 </div>
        //             `;
        //         },
        //     },
        // });

        setEditor(gjsEditor);

        return () => {
            gjsEditor.destroy();
        };
    }, [page]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!editor) return;

        const interval = setInterval(() => {
            saveContent();
        }, 30000);

        return () => clearInterval(interval);
    }, [editor, saveContent]);

    // Keyboard shortcut for save (Ctrl+S / Cmd+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveContent();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveContent]);

    const handlePublishToggle = () => {
        router.patch(route('module.pages.update', page.id), {
            is_published: !page.is_published,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Edit: ${page.title}`} />

            <div className="h-screen flex flex-col">
                {/* Top Toolbar */}
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white px-4 py-2 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('module.pages.index')}
                            className="text-indigo-200 hover:text-white transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Pages
                        </Link>
                        <span className="text-indigo-400">|</span>
                        <span className="font-medium">{page.title}</span>
                    </div>

                    <div className="panel__devices flex items-center gap-2"></div>

                    <div className="flex items-center gap-4">
                        {lastSaved && (
                            <span className="text-indigo-200 text-sm">
                                Last saved: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={saveContent}
                            disabled={isSaving}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 border border-white/20"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handlePublishToggle}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                                page.is_published
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                        >
                            {page.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <Link
                            href={route('module.pages.show', page.id)}
                            target="_blank"
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg text-sm font-medium transition border border-white/20"
                        >
                            Preview
                        </Link>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="flex-1 overflow-hidden">
                    <div ref={editorRef} className="h-full" />
                </div>
            </div>

            <style>{`
                .gjs-one-bg {
                    background-color: #1f2937;
                }
                .gjs-two-color {
                    color: #9ca3af;
                }
                .gjs-three-bg {
                    background-color: #374151;
                }
                .gjs-four-color,
                .gjs-four-color-h:hover {
                    color: #818cf8;
                }
                .gjs-pn-btn {
                    border-radius: 6px;
                }
                .gjs-pn-btn.gjs-pn-active {
                    background-color: #6366f1;
                    color: white;
                }
                .gjs-block {
                    border-radius: 6px;
                    padding: 10px;
                }
                .gjs-block:hover {
                    box-shadow: 0 0 0 2px #6366f1;
                }
                .gjs-cv-canvas {
                    background-color: #e5e7eb;
                }
            `}</style>
        </>
    );
}

