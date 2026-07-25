<?php

return [
    'title' => 'Driver Scoring',

    'nav' => [
        'leaderboard' => 'Leaderboard',
        'events' => 'Events',
        'incentives' => 'Insentif',
        'settings' => 'Pengaturan',
    ],

    'status' => [
        'pending' => 'Pending',
        'approved' => 'Disetujui',
        'paid' => 'Dibayar',
        'rejected' => 'Ditolak',
        'inactive' => 'Nonaktif',
    ],

    'types' => [
        'harsh_brake' => 'Pengereman mendadak',
        'harsh_accel' => 'Akselerasi mendadak',
        'speeding' => 'Speeding',
        'idle' => 'Idle',
        'weekly' => 'Mingguan',
        'monthly' => 'Bulanan',
    ],

    'fields' => [
        'name' => 'Nama',
        'period' => 'Periode',
        'min_avg_score' => 'Skor rata-rata min',
        'min_scored_days' => 'Hari skor min',
        'reward_amount' => 'Jumlah reward',
        'reward_label' => 'Label reward',
        'driver' => 'Driver',
        'score' => 'Skor',
        'type' => 'Tipe',
        'status' => 'Status',
        'date' => 'Tanggal',
        'amount' => 'Jumlah',
    ],

    'actions' => [
        'save_settings' => 'Simpan pengaturan',
        'create_rule' => 'Buat aturan',
        'evaluate_awards' => 'Evaluasi award periode',
        'back' => 'Kembali',
    ],

    'pages' => [
        'leaderboard' => [
            'title' => 'Leaderboard Driver',
            'head' => 'Driver Scoring',
            'empty' => 'Belum ada skor dalam rentang.',
            'empty_hint' => 'Belum ada skor. Pastikan trip in-progress + GPS poll aktif.',
        ],
        'events' => [
            'title' => 'Driving Events',
            'empty' => 'Belum ada event.',
        ],
        'incentives' => [
            'title' => 'Insentif',
            'empty_rules' => 'Belum ada aturan.',
            'empty_awards' => 'Belum ada award.',
        ],
        'settings' => [
            'title' => 'Pengaturan Scoring',
        ],
    ],

    'messages' => [
        'thresholds_updated' => 'Ambang scoring diperbarui.',
        'rule_created' => 'Aturan insentif dibuat.',
        'rule_updated' => 'Aturan insentif diperbarui.',
        'rule_deleted' => 'Aturan insentif dihapus.',
        'awards_created' => ':count award insentif baru dibuat.',
        'award_status_updated' => 'Status award diperbarui.',
    ],
];
