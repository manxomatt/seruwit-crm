<?php

return [
    'title' => 'Paket',

    'fields' => [
        'name' => 'Nama',
        'key' => 'Kunci',
        'key_hint_locked' => 'Kunci tidak bisa diubah — tenant menyimpannya sebagai acuan paketnya.',
        'key_hint_new' => 'Huruf kecil, angka, dan tanda hubung. Permanen setelah dibuat.',
        'description' => 'Deskripsi',
        'sort_order' => 'Urutan Tampil',
        'is_default' => 'Jadikan paket default',
        'is_default_hint' => 'Dipakai tenant yang belum punya paket sendiri. Hanya satu paket bisa jadi default.',
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
            'default_badge' => 'Default',
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
            'no_modules_match' => 'Tidak ada modul yang cocok dengan “:query”.',
            'search_placeholder' => 'Cari modul…',
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
