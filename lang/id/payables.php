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
        'line_updated' => 'Jumlah baris tagihan diperbarui.',
        'line_edit_draft_only' => 'Baris tagihan hanya dapat diedit saat status draft.',
        'match_tolerance_exceeded' => 'Tidak dapat terbitkan: jumlah tertagih berbeda dari ekspektasi PO×GRN di luar toleransi match.',
        'credit_from_return_notes' => 'Kredit dari retur pembelian :return (PO :po)',
        'credit_line_description' => 'Kredit :return — :product × :qty',
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
        'expected' => 'Ekspektasi (PO×GRN)',
        'billed' => 'Tertagih',
        'variance' => 'Selisih',
        'match_ok' => '3-way match dalam toleransi',
        'match_warn' => 'Selisih melebihi toleransi — sesuaikan jumlah atau settings sebelum terbitkan',
        'save_line' => 'Simpan',
    ],

    'payments' => [
        'title' => 'Pembayaran Tagihan',
        'create' => 'Catat Pembayaran',
        'empty' => 'Belum ada pembayaran.',
        'open_bills' => 'Tagihan terbuka',
        'no_open_bills' => 'Tidak ada tagihan terbuka untuk supplier ini.',
    ],

    'fields' => [
        'supplier' => 'Supplier',
        'payment_date' => 'Tanggal pembayaran',
        'method' => 'Metode',
        'amount' => 'Jumlah',
        'reference' => 'Referensi',
        'notes' => 'Catatan',
    ],

    'placeholders' => [
        'select_supplier' => 'Pilih supplier',
        'search_supplier' => 'Cari supplier…',
        'select_method' => 'Pilih metode',
    ],

    'methods' => [
        'cash' => 'Tunai',
        'transfer' => 'Transfer',
        'giro' => 'Giro',
        'other' => 'Lainnya',
    ],
];
