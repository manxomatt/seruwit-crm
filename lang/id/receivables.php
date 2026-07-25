<?php

return [
    'title' => 'Piutang',

    'nav' => [
        'payments' => 'Pembayaran',
        'aging' => 'Aging',
        'credit_limits' => 'Credit Limit',
    ],

    'status' => [
        'posted' => 'Posted',
        'voided' => 'Voided',
    ],

    'types' => [
        'down_payment' => 'DP',
        'down_payment_full' => 'DP (Down Payment)',
        'installment' => 'Cicilan',
        'settlement' => 'Pelunasan',
        'other' => 'Lainnya',
    ],

    'methods' => [
        'cash' => 'Cash',
        'transfer' => 'Transfer',
        'giro' => 'Giro',
        'card' => 'Card',
        'other' => 'Lainnya',
    ],

    'buckets' => [
        'current' => 'Current',
        '1_30' => '1–30',
        '31_60' => '31–60',
        '61_90' => '61–90',
        '90_plus' => '90+',
    ],

    'fields' => [
        'partner' => 'Partner',
        'partner_customer' => 'Partner (Customer)',
        'payment_date' => 'Tanggal Bayar',
        'type' => 'Jenis',
        'method' => 'Metode',
        'amount' => 'Jumlah',
        'payment_amount' => 'Jumlah Bayar',
        'reference_number' => 'No. Referensi',
        'notes' => 'Catatan',
        'recorded_by' => 'Dicatat oleh',
        'date' => 'Tanggal',
        'due' => 'Due',
        'balance' => 'Balance',
        'allocation' => 'Alokasi',
        'allocated' => 'Allocated',
        'limit' => 'Limit',
        'outstanding' => 'Outstanding',
        'available' => 'Available',
        'utilization' => 'Utilization',
        'days_past_due' => 'Days PD',
        'bucket' => 'Bucket',
        'code' => 'Code',
        'invoice' => 'Invoice',
        'type_method' => 'Jenis / Metode',
        'status' => 'Status',
    ],

    'placeholders' => [
        'select' => '— pilih —',
        'search' => 'Cari kode / referensi…',
        'reference' => 'No. transfer / giro',
    ],

    'actions' => [
        'search' => 'Cari',
        'back' => 'Kembali',
        'void' => 'Void',
        'pay' => 'Bayar',
        'full' => 'full',
        'match_amount' => 'samakan',
    ],

    'payments' => [
        'index' => [
            'title' => 'Piutang',
            'head' => 'Piutang — Pembayaran',
            'record' => 'Rekam Pembayaran',
            'open_ar' => 'Open AR',
            'received_this_month' => 'Diterima bulan ini',
            'empty' => 'Belum ada pembayaran.',
            'overdue_alert' => ':count invoice overdue — :amount past due.',
            'view_aging' => 'Lihat aging',
        ],
        'create' => [
            'title' => 'Rekam Pembayaran',
            'allocation_hint' => 'Alokasi: :amount',
            'allocation_section' => 'Alokasi ke Invoice',
            'select_partner_hint' => 'Pilih partner untuk melihat invoice terbuka.',
            'no_open_invoices' => 'Tidak ada invoice terbuka untuk partner ini.',
            'submit' => 'Simpan Pembayaran',
            'client_allocations_required' => 'Alokasikan pembayaran ke minimal satu invoice.',
        ],
        'show' => [
            'void_confirm' => 'Void pembayaran ini? Alokasi akan dibatalkan dari invoice.',
            'allocations' => 'Alokasi',
        ],
    ],

    'aging' => [
        'index' => [
            'title' => 'AR Aging',
            'alert' => 'Alert: :count overdue · :amount',
            'empty' => 'Tidak ada piutang terbuka.',
        ],
    ],

    'credit' => [
        'index' => [
            'title' => 'Credit Limits',
            'over_limit_alert' => ':count partner melebihi credit limit.',
            'empty' => 'Belum ada partner dengan credit limit. Set di Partners → Edit.',
        ],
    ],

    'messages' => [
        'payment_recorded' => 'Pembayaran dicatat.',
        'payment_voided' => 'Pembayaran di-void.',
    ],

    'validation' => [
        'allocations_required' => 'Alokasikan pembayaran ke minimal satu invoice.',
        'amount_gt' => 'Jumlah pembayaran harus lebih dari nol.',
        'allocations_empty' => 'Minimal satu alokasi invoice diperlukan.',
        'amount_mismatch' => 'Jumlah pembayaran harus sama dengan total alokasi.',
        'invoice_wrong_partner' => 'Invoice :code tidak milik partner ini.',
        'invoice_not_open' => 'Invoice :code tidak terbuka untuk pembayaran.',
        'allocation_gt_zero' => 'Jumlah alokasi harus lebih dari nol.',
        'allocation_exceeds_balance' => 'Alokasi untuk :code melebihi sisa saldo.',
        'invoice_no_balance' => 'Invoice tidak memiliki sisa saldo.',
        'void_posted_only' => 'Hanya pembayaran posted yang dapat di-void.',
    ],
];
