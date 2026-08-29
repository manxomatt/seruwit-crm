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

    'placeholders' => [
        'all_drivers' => 'Semua driver',
        'all_vehicles' => 'Semua kendaraan',
        'all_types' => 'Semua tipe',
        'search_drivers' => 'Cari driver…',
    ],

    'actions' => [
        'save_settings' => 'Simpan pengaturan',
        'create_rule' => 'Buat aturan',
        'evaluate_awards' => 'Evaluasi award periode',
        'back' => 'Kembali',
    ],

    'pages' => [
        'leaderboard' => [
            'title' => 'Leaderboard Driver & Performa Keselamatan',
            'subtitle' => 'Pantau peringkat dan skor keselamatan berkendara pengemudi berdasarkan data telemetri GPS Traccar.',
            'head' => 'Driver Scoring & Leaderboard',
            'empty' => 'Belum ada data skor dalam rentang tanggal ini.',
            'empty_hint' => 'Pastikan perjalanan (trip) berstatus in-progress dan modul GPS Traccar aktif merekam data telemetri pengemudi.',
            'fleet_avg_score' => 'Rata-rata Skor Armada',
            'top_performer' => 'Pengemudi Terbaik (MVP)',
            'total_incidents' => 'Total Insiden Pelanggaran',
            'monitored_drivers' => 'Pengemudi Terdaftar',
            'podium_title' => 'Top 3 Performa Terbaik',
            'rank' => 'Peringkat',
            'safety_score' => 'Skor Keselamatan',
            'active_days' => 'Hari Aktif',
            'incident_breakdown' => 'Rincian Insiden',
            'view_analysis' => 'Detail Analitik',
            'period_presets' => [
                'this_week' => 'Minggu Ini',
                'this_month' => 'Bulan Ini',
                'last_30_days' => '30 Hari Terakhir',
            ],
            'filter_from' => 'Dari Tanggal',
            'filter_to' => 'Sampai Tanggal',
            'search_placeholder' => 'Cari nama pengemudi…',
            'score_rating' => [
                'excellent' => 'Sangat Baik',
                'good' => 'Baik',
                'fair' => 'Cukup',
                'poor' => 'Perlu Evaluasi',
            ],
        ],
        'events' => [
            'title' => 'Driving Events',
            'empty' => 'Belum ada event.',
        ],
        'incentives' => [
            'title' => 'Insentif',
            'empty_rules' => 'Belum ada aturan.',
            'empty_awards' => 'Belum ada award.',
            'delete_rule_title' => 'Hapus aturan insentif',
            'delete_rule_confirm' => 'Hapus aturan ":name"? Award terkait aturan ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.',
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
