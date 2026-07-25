<?php

return [
    'title' => 'Live Updates',

    'types' => [
        'info' => 'Info',
        'success' => 'Sukses',
        'warning' => 'Peringatan',
        'error' => 'Error',
    ],

    'fields' => [
        'title' => 'Judul',
        'type' => 'Tipe',
        'content' => 'Konten',
        'published_at' => 'Tanggal Publikasi',
        'is_active' => 'Aktif',
        'create_heading' => 'Buat Update Baru',
        'recent_updates' => 'Update Terbaru',
        'server_time' => 'Waktu server',
        'not_published' => 'Belum dipublikasikan',
        'published' => 'Dipublikasikan',
        'title_placeholder' => 'Judul update',
        'content_placeholder' => 'Konten update...',
        'about_title' => 'Tentang Live Updates',
        'about_description' => 'Halaman ini menggunakan polling Inertia.js v2 untuk memperbarui data secara otomatis setiap 3 detik. Indikator polling menunjukkan kapan halaman sedang mengambil data baru. Anda dapat menjeda/melanjutkan polling menggunakan tombol di header.',
    ],

    'actions' => [
        'add' => 'Buat Update',
        'delete' => 'Hapus',
        'pause' => 'Dijeda',
        'resume' => 'Live',
    ],

    'delete_confirm' => 'Yakin ingin menghapus update ini?',

    'empty' => [
        'title' => 'Belum ada update',
        'hint' => 'Mulai dengan membuat update baru di atas.',
    ],

    'polling_label' => 'Penyegaran otomatis',

    'last_updated' => 'Terakhir diperbarui',

    'messages' => [
        'created' => 'Live update berhasil dibuat.',
        'updated' => 'Live update berhasil diperbarui.',
        'deleted' => 'Live update berhasil dihapus.',
    ],
];
