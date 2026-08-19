<?php

return [
    'nav' => [
        'inbox' => 'Kotak masuk',
        'policies' => 'Kebijakan',
    ],

    'inbox' => [
        'title' => 'Kotak Masuk Persetujuan',
        'head' => 'Persetujuan',
        'new_policy' => 'Kebijakan Baru',
        'pending_banner' => ':count permintaan menunggu persetujuan.',
        'empty' => 'Tidak ada permintaan.',
        'all_triggers' => 'Semua pemicu',
        'columns' => [
            'code' => 'Kode',
            'policy' => 'Kebijakan',
            'trigger' => 'Pemicu',
            'level' => 'Level',
            'by' => 'Oleh',
            'date' => 'Tanggal',
            'status' => 'Status',
        ],
    ],

    'request' => [
        'back' => 'Kembali',
        'policy' => 'Kebijakan',
        'trigger' => 'Pemicu',
        'current_level' => 'Level saat ini',
        'requested_by' => 'Diminta oleh',
        'subject' => 'Subjek',
        'payload' => 'Payload',
        'levels' => 'Level',
        'history' => 'Riwayat',
        'history_line' => ':action oleh :actor (L:level)',
        'note_placeholder' => 'Catatan (opsional)',
        'approve' => 'Setujui',
        'reject' => 'Tolak',
    ],

    'policies' => [
        'title' => 'Kebijakan Persetujuan',
        'head' => 'Kebijakan Persetujuan',
        'new' => 'Kebijakan Baru',
        'subtitle' => 'Konfigurasi alur multi-level tanpa koding: diskon, credit limit, PO besar, order di luar SLA.',
        'empty' => 'Belum ada kebijakan. Buat satu untuk mulai.',
        'edit' => 'Ubah',
        'active' => 'Aktif',
        'inactive' => 'Nonaktif',
        'pending_count' => ':count pending',
        'delete_confirm' => 'Hapus kebijakan ":name"? Tindakan ini tidak dapat dibatalkan.',
        'columns' => [
            'name' => 'Nama',
            'trigger' => 'Pemicu',
            'levels' => 'Level',
            'status' => 'Status',
        ],
    ],

    'form' => [
        'new_title' => 'Kebijakan Baru',
        'edit_title' => 'Ubah Kebijakan',
        'key' => 'Key *',
        'name' => 'Nama *',
        'trigger' => 'Pemicu *',
        'active' => 'Aktif',
        'levels' => 'Level *',
        'add_level' => 'Tambah Level',
        'level_n' => 'Level :n',
        'level_number' => 'Level #',
        'level_name' => 'Nama',
        'yes' => 'Ya',
        'cancel' => 'Batal',
        'create' => 'Buat',
        'update' => 'Simpan',
        'approver_types' => [
            'permission' => 'Permission',
            'role' => 'Role',
            'user' => 'User',
        ],
    ],

    'status' => [
        'pending' => 'Pending',
        'approved' => 'Disetujui',
        'rejected' => 'Ditolak',
        'cancelled' => 'Dibatalkan',
        'commented' => 'Dikomentari',
        'all' => 'Semua status',
    ],

    'triggers' => [
        'po_amount' => [
            'label' => 'PO besar',
            'description' => 'Purchase order yang totalnya mencapai / melebihi ambang.',
            'min_amount' => 'Minimal total PO',
        ],
        'credit_limit' => [
            'label' => 'Credit limit',
            'description' => 'Issue invoice yang akan melebihi batas kredit partner.',
            'requires_exceeded' => 'Hanya jika melebihi limit',
        ],
        'order_discount' => [
            'label' => 'Diskon order',
            'description' => 'Konfirmasi DO dengan diskon di atas ambang.',
            'min_discount_percent' => 'Minimal diskon %',
        ],
        'order_sla' => [
            'label' => 'Order di luar SLA',
            'description' => 'Konfirmasi DO dengan janji kirim lebih cepat dari lead time SLA.',
            'max_lead_hours' => 'Lead time minimum (jam)',
        ],
    ],

    'messages' => [
        'policy_created' => 'Kebijakan persetujuan dibuat.',
        'policy_updated' => 'Kebijakan persetujuan diperbarui.',
        'policy_deleted' => 'Kebijakan persetujuan dihapus.',
        'policy_has_pending' => 'Tidak dapat menghapus kebijakan yang masih memiliki permintaan pending.',
        'approved' => 'Disetujui.',
        'rejected' => 'Ditolak.',
    ],
];
