<?php

return [
    'title' => 'Pesanan Pembayaran',
    'description' => 'Kelola verifikasi pembayaran langganan tenant',

    'statuses' => [
        'pending' => 'Pending',
        'awaiting_confirmation' => 'Menunggu Konfirmasi',
        'confirmed' => 'Dikonfirmasi',
        'rejected' => 'Ditolak',
        'expired' => 'Kedaluwarsa',
        'cancelled' => 'Dibatalkan',
    ],

    'types' => [
        'activate' => 'Aktivasi',
        'renew' => 'Perpanjangan',
        'activate_new' => 'Aktivasi baru',
    ],

    'index' => [
        'search_placeholder' => 'Cari nama tenant…',
        'search_button' => 'Cari',
        'status_all' => 'Semua Status',
        'reset' => 'Reset',
        'empty_filtered' => 'Tidak ada pesanan yang sesuai filter',
        'empty_all' => 'Belum ada pesanan pembayaran',
        'clear_filter' => 'Hapus filter',
        'columns' => [
            'number' => '#',
            'tenant' => 'Tenant',
            'plan' => 'Paket',
            'total' => 'Total',
            'status' => 'Status',
            'date' => 'Tanggal',
        ],
        'actions_menu' => 'Tindakan',
        'view_detail' => 'Lihat Detail',
        'showing' => 'Menampilkan :from–:to dari :total pesanan',
        'showing_count' => ':total pesanan',
    ],

    'show' => [
        'page_title' => 'Pesanan #:id',
        'back' => 'Kembali ke daftar',
        'created_at' => 'Dibuat :date',
        'expires_at' => '· Kedaluwarsa :date',
        'total_transfer_label' => 'Total Transfer',

        'breakdown' => [
            'title' => 'Rincian Nominal',
            'plan_price' => 'Harga paket',
            'unique_code' => 'Kode unik',
            'total' => 'Total transfer',
        ],

        'bank' => [
            'title' => 'Instruksi Transfer',
            'name' => 'Bank',
            'account_number' => 'No. Rekening',
            'account_name' => 'Atas Nama',
        ],

        'workspace' => [
            'title' => 'Detail Workspace',
            'tenant' => 'Tenant',
            'tenant_status' => 'Status tenant',
            'trial_ends' => 'Trial berakhir',
            'plan' => 'Paket',
            'interval' => 'Interval',
            'order_type' => 'Tipe pesanan',
        ],

        'confirmed_block' => [
            'title' => 'Pembayaran dikonfirmasi',
            'by' => 'Oleh :name · :date',
        ],

        'rejected_block' => [
            'title' => 'Pembayaran ditolak',
            'by' => 'Oleh :name · :date',
        ],

        'proof' => [
            'title' => 'Bukti Transfer',
            'download' => 'Unduh bukti transfer',
            'tenant_note' => 'Catatan dari tenant',
            'empty_title' => 'Belum ada bukti transfer',
            'empty_hint' => 'Tenant belum mengunggah bukti pembayaran',
            'expand' => 'Perbesar ↗',
            'open_tab' => 'Buka di tab baru',
        ],

        'subscription' => [
            'title' => 'Langganan Terkait',
            'id' => 'ID Langganan',
            'status' => 'Status',
            'ends_at' => 'Berakhir',
        ],

        'actions' => [
            'reject' => 'Tolak',
            'confirm' => 'Konfirmasi',
        ],

        'confirm_modal' => [
            'title' => 'Konfirmasi Pembayaran',
            'subtitle' => 'Tindakan ini tidak dapat dibatalkan',
            'body' => 'Anda akan mengkonfirmasi transfer sebesar :amount dari :tenant. Langganan paket :plan akan langsung diaktifkan.',
            'cancel' => 'Batal',
            'submit' => 'Ya, Konfirmasi',
            'saving' => 'Menyimpan…',
        ],

        'reject_modal' => [
            'title' => 'Tolak Pembayaran',
            'subtitle' => 'Alasan akan dikirimkan ke tenant',
            'placeholder' => 'Contoh: Nominal transfer tidak sesuai, harap transfer persis Rp 500.123…',
            'cancel' => 'Batal',
            'submit' => 'Tolak Pembayaran',
            'saving' => 'Menyimpan…',
        ],

        'copy' => 'Salin',
    ],
];
