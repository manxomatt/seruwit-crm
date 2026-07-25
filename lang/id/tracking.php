<?php

return [
    'title' => 'Tracking',

    'nav' => [
        'map' => 'Live Map',
        'devices' => 'Perangkat',
        'settings' => 'Pengaturan',
    ],

    'status' => [
        'online' => 'Online',
        'unknown' => 'Tidak diketahui',
        'unpaired' => 'Belum ter-pair',
    ],

    'auth_types' => [
        'basic' => 'Email & password',
        'token' => 'API token',
    ],

    'fields' => [
        'base_url' => 'URL server Traccar',
        'auth_type' => 'Autentikasi',
        'token' => 'API token',
        'email' => 'User Traccar',
        'password' => 'Password',
        'geofence_radius_m' => 'Radius kedatangan (m)',
        'retain_positions_days' => 'Simpan posisi mentah (hari)',
        'trail_every_m' => 'Titik trail setiap (m)',
        'trail_every_minutes' => '…atau setiap (menit)',
        'vehicle' => 'Kendaraan',
        'device' => 'Perangkat',
        'status' => 'Status',
    ],

    'actions' => [
        'sync' => 'Sync dari Traccar',
        'pair' => 'Pair',
        'unpair' => 'Unpair',
        'save' => 'Simpan Pengaturan',
        'test_connection' => 'Tes koneksi',
        'pause_live' => 'Jeda live',
        'resume_live' => 'Lanjut live',
    ],

    'pages' => [
        'map' => [
            'title' => 'Live Map',
            'polling_off' => 'Polling dimatikan. Posisi tidak akan diperbarui otomatis.',
            'last_poll_failed' => 'Poll terakhir gagal: :error',
        ],
        'devices' => [
            'title' => 'Perangkat GPS',
            'empty' => 'Belum ada perangkat.',
            'all_paired' => 'Semua kendaraan sudah punya tracker.',
        ],
        'settings' => [
            'title' => 'Pengaturan Tracking',
        ],
    ],

    'messages' => [
        'settings_saved' => 'Pengaturan tracking disimpan.',
        'fill_credentials' => 'Isi URL server dan kredensial terlebih dahulu.',
        'connection_ok' => 'Berhasil terhubung ke Traccar.',
        'configure_first' => 'Konfigurasi koneksi Traccar terlebih dahulu.',
        'synced' => ':count perangkat disinkronkan dari Traccar.',
        'already_paired' => 'Perangkat ini sudah ter-pair. Unpair dulu.',
        'vehicle_has_tracker' => 'Kendaraan tersebut sudah punya tracker.',
        'paired' => 'Di-pair ke :vehicle.',
        'unpaired' => 'Perangkat di-unpair.',
        'unpair_before_delete' => 'Unpair perangkat dari kendaraan sebelum menghapus.',
        'deleted' => 'Perangkat dihapus.',
    ],
];
