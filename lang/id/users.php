<?php

return [
    'title' => 'Pengguna',

    'fields' => [
        'name' => 'Nama',
        'email' => 'Email',
        'password' => 'Kata Sandi',
        'password_confirmation' => 'Konfirmasi Kata Sandi',
        'password_hint' => 'Kata Sandi (kosongkan untuk mempertahankan yang lama)',
        'roles' => 'Peran',
        'warehouses' => 'Situs yang di-assign',
        'first_name' => 'Nama Depan',
        'last_name' => 'Nama Belakang',
        'phone_number' => 'Nomor Telepon',
        'avatar_url' => 'URL Avatar',
    ],

    'placeholders' => [
        'search' => 'Cari pengguna berdasarkan nama atau email…',
        'avatar_url' => 'https://example.com/avatar.jpg',
    ],

    'sections' => [
        'profile_information' => 'Informasi Profil',
        'account_details' => 'Detail Akun',
    ],

    'roles_selected' => 'Dipilih: :count peran',
    'warehouses_selected' => 'Dipilih: :count situs',
    'warehouses_hint_head' => 'Warehouse Head harus di-assign ke tepat satu situs.',
    'warehouses_hint_manager' => 'Warehouse Manager bisa di-assign ke satu atau lebih situs.',
    'system_badge' => 'Sistem',

    'pages' => [
        'index' => [
            'head' => 'Manajemen Pengguna',
            'new' => 'Tambah Pengguna',
            'empty_title' => 'Belum ada pengguna',
            'empty_hint' => 'Mulai dengan membuat pengguna baru.',
            'columns' => [
                'user' => 'Pengguna',
                'email' => 'Email',
                'roles' => 'Peran',
                'status' => 'Status',
                'created' => 'Dibuat',
            ],
            'no_roles' => 'Tidak ada peran',
            'verified' => 'Terverifikasi',
            'unverified' => 'Belum Diverifikasi',
        ],
        'create' => [
            'title' => 'Buat Pengguna',
            'head' => 'Buat Pengguna',
            'submit' => 'Buat Pengguna',
        ],
        'edit' => [
            'title' => 'Ubah Pengguna - :name',
            'head' => 'Ubah Pengguna',
            'submit' => 'Perbarui Pengguna',
        ],
        'show' => [
            'title' => 'Pengguna - :name',
            'head' => 'Detail Pengguna',
            'user_id' => 'ID Pengguna',
            'username' => 'Nama Pengguna',
            'email_address' => 'Alamat Email',
            'email_verified' => 'Email Terverifikasi',
            'email_not_verified' => 'Email Belum Diverifikasi',
            'email_verified_at' => 'Email Diverifikasi Pada',
            'not_verified' => 'Belum diverifikasi',
            'created_at' => 'Dibuat Pada',
            'updated_at' => 'Terakhir Diperbarui',
            'back' => 'Kembali ke Pengguna',
        ],
    ],

    'actions' => [
        'view' => 'Lihat',
        'edit_user' => 'Ubah Pengguna',
        'delete_user' => 'Hapus Pengguna',
    ],

    'delete_confirm' => [
        'title' => 'Hapus Pengguna',
        'message' => 'Apakah Anda yakin ingin menghapus pengguna ":name" (:email)? Semua data terkait pengguna ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.',
        'message_generic' => 'Apakah Anda yakin ingin menghapus pengguna ini?',
    ],

    'validation' => [
        'name_required' => 'Nama pengguna wajib diisi.',
        'name_max' => 'Nama pengguna tidak boleh lebih dari 255 karakter.',
        'email_required' => 'Alamat email wajib diisi.',
        'email_valid' => 'Masukkan alamat email yang valid.',
        'email_unique' => 'Alamat email ini sudah digunakan.',
        'password_required' => 'Kata sandi wajib diisi.',
        'password_confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        'roles_array' => 'Peran harus berupa array.',
        'roles_exists' => 'Satu atau lebih peran yang dipilih tidak valid.',
        'warehouse_ids_required' => 'Assign minimal satu gudang/toko untuk peran ini.',
        'warehouse_head_single_site' => 'Warehouse Head hanya boleh di-assign ke satu situs.',
    ],

    'messages' => [
        'created' => 'Pengguna berhasil dibuat.',
        'updated' => 'Pengguna berhasil diperbarui.',
        'deleted' => 'Pengguna berhasil dihapus.',
        'invitation_sent' => 'Undangan telah dikirim ke :email.',
        'already_member' => 'Pengguna ini sudah menjadi anggota workspace.',
    ],
];
