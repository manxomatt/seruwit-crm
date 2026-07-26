<?php

return [
    'title' => 'Hutang Usaha',

    'nav' => [
        'bills' => 'Tagihan Supplier',
        'payments' => 'Pembayaran',
    ],

    'status' => [
        'draft' => 'Draft',
        'issued' => 'Diterbitkan',
        'partially_paid' => 'Sebagian dibayar',
        'paid' => 'Lunas',
        'void' => 'Void',
        'posted' => 'Posted',
        'voided' => 'Void',
    ],

    'messages' => [
        'module_unavailable' => 'Modul payables tidak tersedia.',
        'grn_confirmed_only' => 'Hanya GRN terkonfirmasi yang dapat ditagihkan.',
        'grn_already_billed' => 'GRN ini sudah memiliki tagihan supplier aktif.',
        'bill_created' => 'Draft tagihan supplier dibuat dari GRN.',
        'bill_from_grn_notes' => 'Dibuat dari GRN :grn (PO :po)',
        'bill_line_description' => ':grn — :product × :qty :unit',
        'bill_issued' => 'Tagihan supplier diterbitkan.',
        'bill_voided' => 'Tagihan supplier di-void.',
        'issue_draft_only' => 'Hanya draft yang dapat diterbitkan.',
        'void_not_allowed' => 'Tagihan ini tidak dapat di-void.',
        'void_has_payments' => 'Tidak dapat void tagihan yang sudah ada pembayaran.',
        'payment_recorded' => 'Pembayaran tagihan dicatat.',
        'payment_voided' => 'Pembayaran tagihan di-void.',
    ],

    'validation' => [
        'allocations_empty' => 'Tambahkan minimal satu alokasi tagihan.',
        'amount_mismatch' => 'Jumlah pembayaran harus sama dengan total alokasi.',
        'bill_wrong_partner' => 'Tagihan :code bukan milik supplier ini.',
        'bill_not_open' => 'Tagihan :code tidak terbuka untuk pembayaran.',
        'allocation_invalid' => 'Alokasi tidak valid untuk tagihan :code.',
        'payment_already_void' => 'Pembayaran sudah di-void.',
    ],

    'bills' => [
        'title' => 'Tagihan Supplier',
        'empty' => 'Belum ada tagihan supplier.',
        'issue' => 'Terbitkan',
        'void' => 'Void',
        'pay' => 'Catat Pembayaran',
        'from_grn' => 'Buat Tagihan',
    ],

    'payments' => [
        'title' => 'Pembayaran Tagihan',
        'create' => 'Catat Pembayaran',
        'empty' => 'Belum ada pembayaran.',
    ],
];
