<?php

return [
    'title' => 'Trade Promotions',

    'nav' => [
        'programs' => 'Program',
        'realizations' => 'Realisasi',
        'reports' => 'Laporan',
    ],

    'status' => [
        'all' => 'Semua status',
        'draft' => 'Draft',
        'active' => 'Aktif',
        'paused' => 'Dijeda',
        'closed' => 'Ditutup',
        'open' => 'Terbuka',
        'achieved' => 'Tercapai',
        'accrued' => 'Terakru',
        'settled' => 'Diselesaikan',
    ],

    'placeholders' => [
        'all_types' => 'Semua tipe',
    ],

    'types' => [
        'volume_discount' => 'Diskon volume',
        'free_goods' => 'Free goods',
        'rebate' => 'Rebate / rabat',
        'checkout_discount' => 'Diskon checkout (saat jual)',
        'checkout_bogo' => 'BOGO (beli X gratis Y)',
        'checkout_bundle' => 'Bundle (semua SKU ada)',
    ],

    'modes' => [
        'trade' => 'Trade (pasca-periode)',
        'checkout' => 'Checkout (saat jual)',
    ],

    'scopes' => [
        'global' => 'Global (semua site)',
        'sites' => 'Site terpilih',
    ],

    'channels' => [
        'pos' => 'POS',
        'sales' => 'Sales Order',
        'canvassing' => 'Canvassing',
    ],

    'validation' => [
        'global_admin_only' => 'Hanya administrator yang boleh membuat promo global.',
        'site_role_required' => 'Promo site membutuhkan peran warehouse head atau manager.',
        'warehouse_not_accessible' => 'Satu atau lebih gudang tidak dapat diakses.',
        'unauthorized' => 'Anda tidak berwenang mengelola promo ini.',
        'checkout_discount_required' => 'Promo checkout membutuhkan diskon persen atau nominal.',
        'checkout_bogo_required' => 'Promo BOGO membutuhkan qty beli dan qty gratis.',
        'checkout_bundle_products' => 'Promo bundle membutuhkan minimal dua produk.',
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
        'buy_qty' => 'Qty beli',
        'discount_amount' => 'Diskon nominal / unit',
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
        'award_settled_credit' => 'Award diselesaikan dengan credit note #:id.',
        'award_settled_so' => 'Award diselesaikan dengan draft SO #:id.',
        'award_already_settled' => 'Award sudah diselesaikan.',
        'award_void' => 'Award void tidak bisa diselesaikan.',
        'credit_from_award' => 'Kredit promo trade — program :program / award #:award',
        'credit_line_description' => 'Settlement promo (:type) — :program',
        'so_from_free_goods_award' => 'Free goods dari promo :program / award #:award',
        'free_goods_line' => 'Settlement free goods',
        'synced' => ':count realisasi distributor disinkronkan.',
    ],

    'settlement_types' => [
        'credit_note' => 'Credit note',
        'sales_order' => 'Sales order (free goods)',
        'manual' => 'Manual / flag saja',
    ],

    'reports' => [
        'title' => 'Laporan promo',
        'from' => 'Dari',
        'to' => 'Sampai',
        'program' => 'Program',
        'site' => 'Site',
        'all_programs' => 'Semua program',
        'all_sites' => 'Semua site',
        'apply' => 'Terapkan',
        'accrued' => 'Award terakru',
        'settled' => 'Award settled',
        'settlement_mix' => 'Mix settlement',
        'by_channel' => 'Diskon checkout per channel',
        'by_site' => 'Diskon checkout per site',
        'channel' => 'Channel',
        'apps' => 'Aplikasi',
        'discount' => 'Diskon',
        'empty' => 'Tidak ada data untuk filter ini.',
        'unknown_site' => 'Site tidak diketahui',
    ],
];
