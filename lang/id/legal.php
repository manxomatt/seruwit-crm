<?php

return [
    'terms' => [
        'page_title' => 'Syarat & Ketentuan',
        'badge' => '⚖️ Ketentuan Layanan & Registrasi',
        'title' => 'Syarat & Ketentuan Registrasi Platform',
        'last_updated' => 'Terakhir diperbarui: :date',
        'last_updated_date' => '8 Agustus 2026',
        'back_to_register' => 'Kembali ke Halaman Registrasi',
        'copyright' => '© :year :name. Seluruh hak cipta dilindungi.',
        'sections' => [
            'account' => [
                'title' => '1. Ketentuan Akun & Registrasi Pengguna',
                'prefix' => 'Dengan mendaftar dan membuat akun pada platform',
                'suffix' => ', Anda menyatakan bahwa Anda berusia minimal 18 tahun atau memiliki kewenangan legal untuk mewakili badan usaha/perusahaan yang mendaftar. Seluruh informasi yang Anda berikan saat registrasi (nama lengkap, alamat email, dan identitas bisnis) harus akurat dan benar.',
            ],
            'tenant' => [
                'title' => '2. Pengelolaan Tenant & Workspace Bisnis',
                'content' => 'Akun registrasi utama Anda berfungsi sebagai pemilik (owner) awal dari ruang kerja bisnis (tenant workspace). Anda bertanggung jawab penuh atas segala aktivitas, pengelolaan hak akses modul, staf/driver yang diundang, serta kepatuhan data transaksi yang dikelola di dalam workspace Anda.',
            ],
            'security' => [
                'title' => '3. Keamanan Sandi & Hak Akses',
                'content' => 'Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi (password) dan keamanan credential akun. Jika ditemukan indikasi akses tanpa izin atau pelanggaran keamanan pada akun Anda, harap segera hubungi tim dukungan sistem kami.',
            ],
            'intellectual_property' => [
                'title' => '4. Pembatasan Penggunaan & Hak Kekayaan Intelektual',
                'content' => 'Seluruh hak cipta, merek dagang, dan kode sumber platform ini dimiliki secara eksklusif oleh penyedia platform. Pengguna dilarang melakukan penyalahgunaan sistem, rekayasa balik (reverse engineering), atau memanfaatkan platform untuk kegiatan yang melanggar hukum yang berlaku di Republik Indonesia.',
            ],
        ],
    ],
    'privacy' => [
        'page_title' => 'Kebijakan Privasi',
        'badge' => '🔒 Perlindungan Data & Privasi',
        'title' => 'Kebijakan Privasi Pengguna',
        'last_updated' => 'Terakhir diperbarui: :date',
        'last_updated_date' => '8 Agustus 2026',
        'back_to_register' => 'Kembali ke Halaman Registrasi',
        'copyright' => '© :year :name. Seluruh hak cipta dilindungi.',
        'sections' => [
            'collection' => [
                'title' => '1. Pengumpulan Informasi Pribadi & Bisnis',
                'prefix' => 'Kami mengumpulkan informasi yang Anda berikan secara langsung saat registrasi akun dan pembuatan workspace, meliputi nama pengguna, alamat email, nomor telepon bisnis, serta informasi transaksi layanan operasional yang Anda kelola di dalam platform',
                'suffix' => '.',
            ],
            'usage' => [
                'title' => '2. Penggunaan Data & Tujuan Pengolahan',
                'content' => 'Data yang dikumpulkan digunakan semata-mata untuk mengoperasikan platform CRM, memverifikasi identitas pengguna, mengelola tagihan & reservasi, memberikan layanan dukungan pelanggan, serta meningkatkan kinerja dan keamanan platform secara berkelanjutan.',
            ],
            'security' => [
                'title' => '3. Keamanan Data & Isolasi Tenant',
                'content' => 'Seluruh data tenant disimpan dengan isolasi skema database (multi-tenancy isolation) dan enkripsi jaringan berstandar industri. Kami tidak pernah menjual atau membagikan data bisnis pribadi Anda kepada pihak ketiga tanpa persetujuan tertulis dari Anda.',
            ],
            'rights' => [
                'title' => '4. Hak Pengguna & Retensi Data',
                'content' => 'Pengguna berhak meminta pembaruan data, ekspor data transaksi bisnis, atau penghapusan akun sesuai dengan prosedur dan regulasi pelindungan data pribadi yang berlaku.',
            ],
        ],
    ],
];
