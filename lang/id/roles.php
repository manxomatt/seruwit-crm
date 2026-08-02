<?php

return [
    'title' => 'Peran',

    'fields' => [
        'name' => 'Nama Peran',
        'description' => 'Deskripsi',
        'permissions' => 'Hak Akses',
        'slug' => 'Slug',
        'type' => 'Tipe',
    ],

    'placeholders' => [
        'search' => 'Cari peran berdasarkan nama atau deskripsi…',
        'name' => 'Misal: Editor, Moderator',
        'description' => 'Jelaskan apa yang bisa dilakukan peran ini…',
    ],

    'type' => [
        'system' => 'Sistem',
        'custom' => 'Kustom',
    ],

    'permissions_selected' => 'Dipilih: :count hak akses',

    'pages' => [
        'index' => [
            'head' => 'Manajemen Peran',
            'new' => 'Tambah Peran',
            'empty_title' => 'Belum ada peran',
            'empty_hint' => 'Mulai dengan membuat peran baru.',
            'columns' => [
                'role' => 'Peran',
                'description' => 'Deskripsi',
                'users' => 'Pengguna',
                'permissions' => 'Hak Akses',
                'type' => 'Tipe',
                'created' => 'Dibuat',
            ],
            'users_count' => ':count pengguna',
            'permissions_count' => ':count hak akses',
        ],
        'create' => [
            'title' => 'Buat Peran',
            'head' => 'Buat Peran',
            'submit' => 'Buat Peran',
            'submitting' => 'Membuat…',
        ],
        'edit' => [
            'title' => 'Ubah Peran: :name',
            'head' => 'Ubah Peran: :name',
            'submit' => 'Simpan Perubahan',
            'submitting' => 'Menyimpan…',
            'system_notice_title' => 'Peran Sistem',
            'system_notice_body' => 'Nama dan deskripsi terkunci untuk peran sistem. Anda tetap dapat menambah atau menyesuaikan hak akses di luar default.',
        ],
        'show' => [
            'title' => 'Peran: :name',
            'head' => 'Detail Peran: :name',
            'information' => 'Informasi Peran',
            'name' => 'Nama',
            'slug' => 'Slug',
            'users_count' => ':count pengguna',
            'description_empty' => 'Tidak ada deskripsi',
            'created' => 'Dibuat',
            'updated' => 'Terakhir Diperbarui',
            'permissions_title' => 'Hak Akses (:count)',
            'permissions_empty' => 'Belum ada hak akses untuk peran ini.',
            'users_title' => 'Pengguna dengan Peran Ini (:count)',
            'users_empty' => 'Belum ada pengguna dengan peran ini.',
            'view_user' => 'Lihat Pengguna',
        ],
    ],

    'actions' => [
        'view' => 'Lihat',
        'select_all' => 'Pilih Semua',
        'clear_all' => 'Hapus Semua',
        'edit_role' => 'Ubah Peran',
        'back_to_roles' => 'Kembali ke Peran',
    ],

    'delete_confirm' => [
        'title' => 'Hapus Peran',
        'message' => 'Apakah Anda yakin ingin menghapus peran ":name"? Tindakan ini tidak dapat dibatalkan.',
        'message_generic' => 'Apakah Anda yakin ingin menghapus peran ini?',
    ],

    'validation' => [
        'name_required' => 'Nama peran wajib diisi.',
        'name_max' => 'Nama peran tidak boleh lebih dari 255 karakter.',
        'name_unique' => 'Peran dengan nama ini sudah ada.',
        'description_max' => 'Deskripsi tidak boleh lebih dari 500 karakter.',
        'permissions_array' => 'Hak akses harus berupa array.',
        'permissions_exists' => 'Satu atau lebih hak akses yang dipilih tidak valid.',
    ],

    'messages' => [
        'created' => 'Peran berhasil dibuat.',
        'updated' => 'Peran berhasil diperbarui.',
        'deleted' => 'Peran berhasil dihapus.',
        'system_cannot_modify' => 'Identitas peran sistem tidak dapat diubah.',
        'system_cannot_delete' => 'Peran sistem tidak dapat dihapus.',
        'cannot_delete_assigned' => 'Tidak dapat menghapus peran yang masih memiliki pengguna.',
    ],
];
