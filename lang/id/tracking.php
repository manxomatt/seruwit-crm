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

    'providers' => [
        'traccar' => 'Traccar (generic)',
        'sky_track' => 'Sky Track (custom)',
    ],

    'auth_types' => [
        'basic' => 'Email & password',
        'token' => 'API token',
        'api_key' => 'API key (X-Api-Key)',
    ],

    'fields' => [
        'provider' => 'Provider GPS',
        'base_url' => 'URL server Traccar',
        'sky_track_url' => 'URL API Sky Track',
        'auth_type' => 'Autentikasi',
        'token' => 'API token',
        'api_key' => 'API key',
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

    'placeholders' => [
        'select_vehicle' => 'Pilih kendaraan',
    ],

    'actions' => [
        'sync' => 'Sinkronisasi perangkat',
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
            'vehicles' => 'Kendaraan',
            'reporting' => ':count melapor',
            'empty' => 'Belum ada perangkat yang melaporkan posisi. Sinkronkan perangkat di tab Perangkat, lalu tunggu poll berikutnya.',
            'empty_filter' => 'Tidak ada kendaraan yang cocok dengan filter.',
            'search' => 'Cari kendaraan, plat, atau perangkat…',
            'filter_vehicle' => 'Kendaraan',
            'filter_all_vehicles' => 'Semua kendaraan',
            'filter_status' => 'Status',
            'filter_all' => 'Semua status',
            'filter_moving' => 'Bergerak',
            'filter_idle' => 'Diam',
            'filter_stale' => 'Tidak update',
            'show_all' => 'Tampilkan semua kendaraan',
            'prev_page' => 'Sebelumnya',
            'next_page' => 'Berikutnya',
            'last_refreshed' => 'Poll terakhir: :time',
            'never' => 'belum pernah',
            'polling_off' => 'Polling dimatikan. Posisi tidak akan diperbarui otomatis.',
            'last_poll_failed' => 'Poll terakhir gagal: :error',
        ],
        'devices' => [
            'title' => 'Perangkat GPS',
            'empty' => 'Belum ada perangkat.',
            'empty_search' => 'Tidak ada perangkat yang cocok dengan pencarian.',
            'empty_hint' => 'Gunakan Sinkronisasi untuk mengimpor tracker dari provider GPS.',
            'search' => 'Cari perangkat, IMEI, atau kendaraan ter-pair…',
            'all_paired' => 'Semua kendaraan sudah punya tracker.',
        ],
        'settings' => [
            'title' => 'Pengaturan Tracking',
            'traccar_hint' => 'Server kompatibel Traccar (generic). Autentikasi dengan email/password atau API token.',
            'sky_track_hint' => 'Integrasi khusus Sky Track. Autentikasi memakai header X-Api-Key.',
            'api_key_hint' => 'Dikirim sebagai header X-Api-Key. Kosongkan untuk mempertahankan key yang tersimpan.',
        ],
    ],

    'messages' => [
        'settings_saved' => 'Pengaturan tracking disimpan.',
        'fill_credentials' => 'Isi URL server dan kredensial terlebih dahulu.',
        'connection_ok' => 'Berhasil terhubung ke provider GPS.',
        'configure_first' => 'Konfigurasi koneksi provider GPS terlebih dahulu.',
        'synced' => ':count perangkat disinkronkan dari provider GPS.',
        'already_paired' => 'Perangkat ini sudah ter-pair. Unpair dulu.',
        'vehicle_has_tracker' => 'Kendaraan tersebut sudah punya tracker.',
        'paired' => 'Di-pair ke :vehicle.',
        'unpaired' => 'Perangkat di-unpair.',
        'unpair_before_delete' => 'Unpair perangkat dari kendaraan sebelum menghapus.',
        'deleted' => 'Perangkat dihapus.',
    ],
];
