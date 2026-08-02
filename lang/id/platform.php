<?php

return [
    'registry' => [
        'title' => 'Modul Platform',
        'description' => 'Menonaktifkan modul di sini memutus akses semua tenant ke modul tersebut seketika, terlepas dari paket langganan atau status pasangnya masing-masing. Data tenant tidak tersentuh — mengaktifkan kembali langsung memulihkan semuanya, persis seperti menurunkan lalu menaikkan paket.',
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
        'plan_label' => 'Paket Langganan',
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
            'installing' => 'Memasang…',
            'uninstalling' => 'Mencopot…',
            'uninstall' => 'Copot',
            'needs_upgrade' => 'Perlu upgrade',
        ],
        'packs_heading' => 'Pack vertikal',
        'packs_hint' => 'Pasang atau copot sekumpulan modul untuk satu jenis bisnis sekaligus, plus data demo jika tersedia.',
        'packs_modules_prefix' => 'Termasuk:',
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
        'module_uninstalled' => 'Modul :module dicopot. Datanya disimpan :days hari — pasang lagi sebelum itu untuk memulihkannya.',
    ],
];
