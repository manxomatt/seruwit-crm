<?php

return [
    'title' => 'Paket',

    'stats' => [
        'available_plans' => 'Paket Tersedia',
        'available_plans_hint' => 'Tingkatan paket langganan untuk tenant',
        'total_tenants' => 'Total Tenant Berlangganan',
        'total_tenants_hint' => 'Langganan tenant aktif di seluruh paket',
        'default_fallback' => 'Paket Default Fallback',
        'default_fallback_hint' => 'Otomatis digunakan tenant tanpa paket',
        'none' => 'Tidak Ada',
    ],

    'header' => [
        'title' => 'Paket Langganan SaaS',
        'subtitle' => 'Atur harga, periode billing, serta alokasi modul yang didapatkan oleh setiap tenant.',
    ],

    'billing' => [
        'monthly' => 'Bulanan',
        'annual' => 'Tahunan',
        'per_month' => '/ bln',
        'per_year' => '/ thn',
        'monthly_not_set' => 'Harga bulanan belum diset',
        'save_percent' => 'Hemat :percent%',
        'modules_covered' => 'Modul Tercover (:count)',
        'no_modules_allocated' => 'Belum ada modul dialokasikan',
        'tenants_enrolled' => ':count Tenant Terdaftar',
        'annual_savings_note' => 'Opsi tahunan memberikan penghematan sebesar :percent% dibanding bayar bulanan.',
    ],

    'tabs' => [
        'main_info' => '1. Informasi Utama',
        'pricing' => '2. Harga & Penagihan',
        'modules' => '3. Modul (:count)',
    ],

    'fields' => [
        'name' => 'Nama Paket',
        'name_placeholder' => 'Contoh: Enterprise Plan',
        'key' => 'Kunci',
        'key_hint_locked' => 'Kunci tidak bisa diubah — tenant menyimpannya sebagai acuan paketnya.',
        'key_hint_new' => 'Huruf kecil, angka, dan tanda hubung. Permanen setelah dibuat.',
        'description' => 'Deskripsi',
        'description_placeholder' => 'Berikan gambaran singkat mengenai paket ini...',
        'sort_order' => 'Urutan Tampil',
        'is_default' => 'Jadikan paket default',
        'is_default_hint' => 'Dipakai tenant yang belum punya paket sendiri. Hanya satu paket bisa jadi default.',
    ],

    'form' => [
        'currency_title' => 'Struktur Harga & Mata Uang',
        'monthly_section' => '1. Langganan Bulanan',
        'monthly_normal' => 'Harga Bulanan Normal',
        'monthly_original' => 'Harga Bulanan Coret',
        'annual_section' => '2. Langganan Tahunan',
        'annual_normal' => 'Harga Tahunan',
        'annual_original' => 'Harga Tahunan Coret',
        'hint_paid' => 'harga yang dibayar tenant',
        'hint_original' => 'opsional dicoret',
        'hint_annual_paid' => 'total bayar per tahun',
        'modules_allocation_title' => 'Alokasi Modul SaaS',
        'modules_allocation_subtitle' => 'Pilih modul yang akan dibuka secara otomatis untuk tenant paket ini.',
        'select_modules' => 'Pilih Modul Diberikan',
        'modules_selected' => ':count Terpilih',
    ],

    'preview' => [
        'live_preview' => 'Live Plan Preview',
        'name_placeholder' => 'Nama Paket',
        'desc_placeholder' => 'Deskripsi singkat paket akan muncul di sini.',
        'no_modules' => 'Belum ada modul dipilih',
    ],

    'tiers' => [
        'vertical' => [
            'label' => 'Fitur Bisnis',
            'hint' => 'Modul yang dijual sebagai fitur utama',
        ],
        'foundation' => [
            'label' => 'Fondasi',
            'hint' => 'Data & layanan yang menopang fitur bisnis',
        ],
        'content' => [
            'label' => 'Konten & Situs',
            'hint' => 'Halaman publik dan CMS',
        ],
    ],

    'pages' => [
        'index' => [
            'head' => 'Paket',
            'new' => 'Tambah Paket',
            'description' => 'Paket menentukan modul apa yang boleh dipasang tenant. Mengubah paket berlaku untuk semua tenant di dalamnya pada request berikutnya, dan tidak pernah menghapus data — mempersempit paket hanya mengunci modulnya.',
            'default_badge' => 'DEFAULT',
            'no_modules' => 'Tanpa modul tambahan',
            'module_disabled_title' => 'Modul ini dinonaktifkan platform',
            'tenant_count' => ':count tenant di paket ini',
            'default_suffix' => ' (termasuk yang belum punya paket sendiri)',
            'delete_disabled_default' => 'Paket default tidak bisa dihapus',
            'delete_disabled_in_use' => 'Masih dipakai tenant',
            'modal_edit_title' => 'Ubah paket :name',
            'modal_create_title' => 'Paket baru',
            'modules_section_title' => 'Modul dalam paket ini',
            'modules_selected_count' => ':count dipilih',
            'no_modules_registered' => 'Belum ada modul opsional yang terdaftar.',
            'no_modules_match' => 'Tidak ada modul sesuai pencarian',
            'search_placeholder' => 'Cari nama atau key modul…',
            'module_disabled_badge' => 'Nonaktif',
            'tenants_warning' => ':count tenant memakai paket ini. Mencabut modul akan mengunci aksesnya bagi mereka — data mereka tetap utuh dan kembali jika modulnya dimasukkan lagi.',
            'delete_title' => 'Hapus paket :name?',
            'delete_message' => 'Paket ini tidak dipakai tenant mana pun, jadi menghapusnya tidak berdampak pada workspace yang berjalan.',
        ],
    ],

    'actions' => [
        'select_all' => 'Pilih semua',
        'clear_all' => 'Kosongkan',
        'delete_confirm' => 'Hapus paket',
        'saving' => 'Menyimpan…',
        'back' => '← Kembali',
        'next' => 'Lanjut →',
    ],

    'validation' => [
        'key_regex' => 'Kunci hanya boleh berisi huruf kecil, angka, dan tanda hubung.',
        'key_unique' => 'Kunci ini sudah dipakai paket lain.',
        'modules_in' => 'Modul tersebut tidak terdaftar.',
    ],

    'messages' => [
        'created' => 'Paket :name dibuat.',
        'updated' => 'Paket :name diperbarui. Perubahan berlaku untuk semua tenant di paket ini.',
        'deleted' => 'Paket :name dihapus.',
        'delete_in_use' => 'Paket :name masih dipakai :count tenant. Pindahkan mereka dulu sebelum menghapusnya.',
        'delete_default' => 'Paket default tidak bisa dihapus. Tetapkan paket lain sebagai default dulu.',
    ],
];
