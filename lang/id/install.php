<?php

return [
    'title' => 'Instalasi',
    'subtitle' => 'Penyiapan pertama kali',

    'steps' => [
        'welcome' => 'Selamat Datang',
        'requirements' => 'Persyaratan',
        'database' => 'Basis Data',
        'migrate' => 'Migrasi',
        'platform' => 'Platform',
        'admin' => 'Admin',
        'complete' => 'Selesai',
    ],

    'welcome' => [
        'heading' => 'Selamat datang',
        'intro' => 'Wizard ini menyiapkan control plane platform dan membuat administrator pertama. Workspace dan modul ditambahkan setelahnya.',
        'start' => 'Mulai',
    ],

    'token' => [
        'heading' => 'Token installer',
        'label' => 'Token installer',
        'hint' => 'Deployment ini memerlukan token untuk menjalankan installer. Dapatkan dengan menjalankan php artisan app:install-token.',
        'invalid' => 'Token installer tidak valid.',
        'unlock' => 'Buka',
    ],

    'requirements' => [
        'heading' => 'Persyaratan server',
        'intro' => 'Semua ini harus terpenuhi sebelum instalasi.',
        'all_passed' => 'Semua persyaratan terpenuhi.',
        'some_failed' => 'Sebagian persyaratan belum terpenuhi. Perbaiki, lalu muat ulang.',
    ],

    'database' => [
        'heading' => 'Koneksi basis data',
        'intro' => 'Masukkan kredensial basis data central. Diuji dulu sebelum ditulis.',
        'driver' => 'Driver',
        'host' => 'Host',
        'port' => 'Port',
        'database' => 'Nama basis data',
        'username' => 'Nama pengguna',
        'password' => 'Kata sandi',
        'submit' => 'Uji & simpan',
    ],

    'migrate' => [
        'heading' => 'Buat skema',
        'intro' => 'Jalankan migrasi central dan seed platform (peran, izin, paket). Mungkin butuh beberapa saat.',
        'run' => 'Jalankan migrasi',
        'running' => 'Memigrasi…',
    ],

    'platform' => [
        'heading' => 'Profil platform',
        'intro' => 'Beri nama aplikasi dan tentukan perilaku domain central.',
        'app_name' => 'Nama aplikasi',
        'app_url' => 'URL aplikasi',
        'tenant_base_domain' => 'Domain dasar tenant',
        'tenant_base_domain_hint' => 'Kosongkan untuk memakai host APP_URL.',
        'profile' => 'Profil deployment',
        'profile_development' => 'Development — central melayani seluruh CRM',
        'profile_production' => 'Production — central hanya control plane',
        'ai_features' => 'Aktifkan fitur AI',
        'submit' => 'Simpan profil',
    ],

    'admin' => [
        'heading' => 'Akun administrator',
        'intro' => 'Buat administrator platform pertama.',
        'name' => 'Nama',
        'email' => 'Email',
        'password' => 'Kata sandi',
        'password_confirmation' => 'Konfirmasi kata sandi',
        'submit' => 'Buat admin',
    ],

    'complete' => [
        'heading' => 'Siap diluncurkan',
        'intro' => 'Semua telah dikonfigurasi. Menyelesaikan akan menyegel installer dan membawa Anda ke aplikasi.',
        'launch' => 'Selesai & luncurkan',
    ],

    'actions' => [
        'next' => 'Berikutnya',
        'back' => 'Kembali',
    ],
];
