<?php

return [
    'registry' => [
        'title' => 'Modul Platform',
        'description' => 'Menonaktifkan modul di sini memutus akses semua tenant ke modul tersebut seketika, terlepas dari paket langganan atau status pasangnya masing-masing. Data tenant tidak tersentuh — mengaktifkan kembali langsung memulihkan semuanya, persis seperti menurunkan lalu menaikkan paket.',
        'search_placeholder' => 'Cari modul…',
        'empty_search' => 'Tidak ada modul yang cocok dengan pencarian.',
        'showing' => 'Menampilkan :from–:to dari :total modul',
        'status' => [
            'active' => 'Aktif',
            'disabled' => 'Dinonaktifkan',
        ],
        'requires_prefix' => 'Membutuhkan:',
        'actions' => [
            'enable' => 'Aktifkan',
            'disable' => 'Nonaktifkan',
            'processing' => 'Memproses…',
        ],
    ],

    'modules_catalog' => [
        'title' => 'Modul',
        'description' => 'Kelola modul operasional dan data demo untuk ruang kerja Anda',
        'plan_label' => 'Paket Langganan',
        'plan_badge' => 'Paket: :plan',
        'plans' => [
            'trial' => [
                'name' => 'Trial 30 Hari',
                'description' => 'Masa uji coba mandiri: mencakup modul rental & travel serta CMS konten (akuntansi & mitra bawaan).',
            ],
            'free' => [
                'name' => 'Free Lifetime',
                'description' => 'Gratis selamanya untuk rental mobil pemula dengan armada hingga 2 unit.',
            ],
            'basic' => [
                'name' => 'Starter Rental',
                'description' => 'Solusi ideal untuk bisnis rental mobil rintisan dengan armada hingga 5 unit.',
            ],
            'starter_rental' => [
                'name' => 'Starter Rental',
                'description' => 'Solusi ideal untuk bisnis rental mobil rintisan dengan armada hingga 5 unit.',
            ],
            'pro' => [
                'name' => 'Pro Rental',
                'description' => 'Paket terlengkap untuk rental berkembang: servis armada, reminder pajak, dan pelacakan GPS.',
            ],
            'pro_rental' => [
                'name' => 'Pro Rental',
                'description' => 'Paket terlengkap untuk rental berkembang: servis armada, reminder pajak, dan pelacakan GPS.',
            ],
            'pay_as_you_go' => [
                'name' => 'Pay As You Go',
                'description' => 'Fleksibel bayar per armada kendaraan aktif tanpa biaya langganan bulanan tetap.',
            ],
            'enterprise' => [
                'name' => 'Enterprise',
                'description' => 'Kapasitas armada tak terbatas dengan seluruh modul operasional dan fitur prioritas.',
            ],
        ],
        'available_heading' => 'Modul yang Tersedia',
        'available_hint' => 'Mencopot modul tidak menghapus datanya. Data disimpan :days hari — pasang lagi sebelum itu dan semuanya kembali seperti semula.',
        'empty' => 'Belum ada modul opsional yang terdaftar.',
        'states' => [
            'installed' => 'Terpasang',
            'available' => 'Tersedia',
            'uninstalled' => 'Dicopot',
            'locked' => 'Perlu upgrade',
            'locked_with_data' => 'Terkunci',
            'disabled' => 'Dinonaktifkan',
            'disabled_with_data' => 'Dinonaktifkan',
        ],
        'purges_at' => 'Data dihapus permanen pada :date.',
        'locked_with_data_hint' => 'Data lamamu masih tersimpan dan akan kembali begitu paketmu mencakup modul ini.',
        'disabled_hint' => 'Modul ini sedang dinonaktifkan platform untuk semua tenant.',
        'disabled_with_data_hint' => 'Modul ini sedang dinonaktifkan platform untuk semua tenant — datamu tetap tersimpan dan kembali begitu diaktifkan lagi.',
        'plans_offering_hint' => 'Tersedia di paket :plans.',
        'requires_prefix' => 'Membutuhkan:',
        'actions' => [
            'install' => 'Pasang',
            'install_pack' => 'Pasang pack',
            'uninstall_pack' => 'Copot pack',
            'install_demo' => 'Pasang data demo',
            'uninstall_demo' => 'Hapus data demo',
            'installing' => 'Memasang…',
            'uninstalling' => 'Mencopot…',
            'uninstall' => 'Copot',
            'needs_upgrade' => 'Perlu upgrade',
        ],
        'packs_heading' => 'Pack vertikal',
        'packs_hint' => 'Pasang atau copot sekumpulan modul untuk satu jenis bisnis sekaligus, plus data demo jika tersedia.',
        'packs_modules_prefix' => 'Termasuk:',
        'packs_seed_only' => 'Hanya master data (tanpa modul opsional)',
        'demos_heading' => 'Data demo',
        'demos_hint' => 'Data sampel untuk training dan demo. Diaktifkan oleh admin platform untuk workspace ini.',
        'demos_includes_prefix' => 'Juga memasang:',
        'demos_requires_module' => 'Memerlukan modul :module terpasang terlebih dahulu.',
        'uninstall_confirm' => [
            'title' => 'Copot modul :module?',
            'message' => 'Menu dan aksesnya dicabut sekarang, tapi datanya disimpan :days hari. Pasang lagi sebelum itu dan semuanya kembali utuh.',
            'confirm' => 'Copot modul',
        ],
    ],

    'messages' => [
        'module_enabled' => 'Modul :module diaktifkan kembali.',
        'module_disabled' => 'Modul :module dinonaktifkan untuk semua tenant.',
        'module_installed' => 'Modul :module berhasil dipasang.',
        'pack_installed' => 'Pack :pack berhasil dipasang.',
        'pack_uninstalled' => 'Pack :pack dicopot. Data demo dihapus; data modul disimpan :days hari.',
        'demo_installed' => 'Data demo :demo berhasil dipasang.',
        'demo_uninstalled' => 'Data demo :demo dihapus.',
        'module_uninstalled' => 'Modul :module dicopot. Datanya disimpan :days hari — pasang lagi sebelum itu untuk memulihkannya.',
    ],
];
