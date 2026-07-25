<?php

return [
    'title' => 'Trade Promotions',

    'nav' => [
        'programs' => 'Program',
        'realizations' => 'Realisasi',
    ],

    'status' => [
        'all' => 'semua',
        'draft' => 'draft',
        'active' => 'aktif',
        'paused' => 'dijeda',
        'closed' => 'ditutup',
        'accrued' => 'terakru',
        'settled' => 'diselesaikan',
    ],

    'types' => [
        'volume_discount' => 'Diskon volume',
        'free_goods' => 'Free goods',
        'rebate' => 'Rebate / rabat',
    ],

    'metrics' => [
        'volume' => 'Volume (qty)',
        'value' => 'Nilai (Rp)',
    ],

    'calc_basis' => [
        'qty' => 'Per unit qty',
        'net_value' => '% dari nilai',
    ],

    'fields' => [
        'code' => 'Kode',
        'name' => 'Nama',
        'type' => 'Tipe',
        'period' => 'Periode',
        'target' => 'Target',
        'status' => 'Status',
        'description' => 'Deskripsi',
        'principal' => 'Principal',
        'principal_optional' => 'Principal (opsional)',
        'starts_at' => 'Mulai',
        'ends_at' => 'Selesai',
        'target_metric' => 'Metrik target',
        'target_amount' => 'Jumlah target',
        'notes' => 'Catatan',
        'min_qty' => 'Qty min',
        'discount_percent' => 'Diskon %',
        'free_product' => 'Produk gratis',
        'free_qty' => 'Qty gratis',
        'rebate_percent' => 'Rebate %',
        'rebate_per_unit' => 'Rebate per unit',
        'calc_basis' => 'Dasar hitung',
        'distributor' => 'Distributor',
        'qty' => 'Qty',
        'value' => 'Nilai',
        'achievement' => 'Pencapaian',
        'awards' => 'Award',
        'program' => 'Program',
    ],

    'programs' => [
        'index' => [
            'title' => 'Trade Promotions',
            'new' => 'Program Baru',
            'subtitle' => 'Program promo distributor: diskon volume, free goods, rabat — periode aktif & realisasi vs target.',
            'empty' => 'Belum ada program promo.',
            'realizations_abbr' => ':count real.',
        ],
        'create' => [
            'title' => 'Program Promo Baru',
            'eligible_distributors' => 'Distributor eligible (kosong = semua pelanggan)',
            'eligible_products' => 'Produk eligible (kosong = semua)',
            'tiers' => 'Tier',
            'add_tier' => 'Tambah tier',
            'submit' => 'Buat program',
        ],
        'edit' => [
            'title' => 'Edit Program',
            'hint' => 'Tipe: :type. Distributor dipilih: :partners. Produk: :products. Gunakan Create untuk edit tier lengkap pada program baru; di sini Anda dapat menyesuaikan periode dan target.',
            'all' => 'semua',
            'submit' => 'Simpan',
        ],
        'show' => [
            'activate' => 'Aktifkan',
            'sync' => 'Sinkron realisasi',
            'close' => 'Tutup',
            'distributors' => 'Distributor',
            'all_customers' => 'Semua pelanggan',
            'products' => 'Produk',
            'all_products' => 'Semua produk',
            'tiers' => 'Tier',
            'min_qty' => 'Qty min :qty',
            'discount_off' => 'diskon :percent%',
            'free_goods' => 'gratis :qty :product',
            'rebate_rule' => 'Aturan rebate',
            'rebate_basis' => '· basis :basis',
            'realization_title' => 'Realisasi vs target',
            'empty_realization' => 'Belum ada realisasi. Klik Sync setelah ada DO dalam periode.',
            'settle' => 'Settle',
        ],
    ],

    'realizations' => [
        'index' => [
            'title' => 'Realisasi Promo',
            'all_programs' => 'Semua program',
            'empty' => 'Belum ada realisasi.',
        ],
    ],

    'messages' => [
        'program_created' => 'Program :code dibuat.',
        'program_updated' => 'Program diperbarui.',
        'program_activated' => 'Program diaktifkan.',
        'program_closed' => 'Program ditutup.',
        'program_deleted' => 'Program dihapus.',
        'closed_cannot_edit' => 'Program yang ditutup tidak dapat diedit.',
        'deactivate_before_delete' => 'Nonaktifkan atau tutup program sebelum menghapus.',
        'award_settled' => 'Award diselesaikan.',
        'award_already_settled' => 'Award sudah diselesaikan.',
        'synced' => ':count realisasi distributor disinkronkan.',
    ],
];
