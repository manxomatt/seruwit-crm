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
        'fleet_bases' => 'Base armada yang di-assign',
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

    'stats' => [
        'total_users' => 'Total Pengguna',
        'verified_users' => 'Terverifikasi',
        'unverified_users' => 'Belum Terverifikasi',
        'admin_users' => 'Pengguna Admin',
    ],

    'filters' => [
        'all_status' => 'Semua Status',
        'verified' => 'Terverifikasi',
        'unverified' => 'Belum Terverifikasi',
    ],

    'view_modes' => [
        'grid' => 'Tampilan Kartu',
        'table' => 'Tampilan Tabel',
    ],

    'roles_selected' => 'Dipilih: :count peran',
    'warehouses_selected' => 'Dipilih: :count situs',
    'warehouses_hint_head' => 'Warehouse Head harus di-assign ke tepat satu situs.',
    'warehouses_hint_manager' => 'Warehouse Manager bisa di-assign ke satu atau lebih situs.',
    'fleet_bases_selected' => 'Dipilih: :count base armada',
    'fleet_bases_hint_head' => 'Fleet Base Head harus di-assign ke tepat satu base.',
    'fleet_bases_hint_manager' => 'Fleet Base Manager bisa di-assign ke satu atau lebih base.',
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
        'email_central_exists' => 'Alamat email ini sudah terdaftar di platform. Gunakan fitur Undang Pengguna untuk menambahkan akun yang sudah ada.',
        'password_required' => 'Kata sandi wajib diisi.',
        'password_confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        'roles_array' => 'Peran harus berupa array.',
        'roles_exists' => 'Satu atau lebih peran yang dipilih tidak valid.',
        'warehouse_ids_required' => 'Assign minimal satu gudang/toko untuk peran ini.',
        'warehouse_head_single_site' => 'Warehouse Head hanya boleh di-assign ke satu situs.',
        'fleet_base_ids_required' => 'Assign minimal satu base armada untuk peran ini.',
        'fleet_base_head_single_base' => 'Fleet Base Head hanya boleh di-assign ke satu base.',
        'limit_reached_users' => 'Tenant telah mencapai batas maksimal :limit pengguna sesuai paket langganan.',
    ],

    'messages' => [
        'created' => 'Pengguna berhasil dibuat.',
        'updated' => 'Pengguna berhasil diperbarui.',
        'deleted' => 'Pengguna berhasil dihapus.',
        'invitation_sent' => 'Undangan telah dikirim ke :email.',
        'invitation_resent' => 'Undangan telah berhasil dikirim ulang ke :email.',
        'invitation_revoked' => 'Undangan telah dibatalkan.',
        'invitation_already_accepted' => 'Undangan ini sudah diterima sebelumnya.',
        'already_member' => 'Pengguna ini sudah menjadi anggota workspace.',
        'limit_reached_users' => 'Tenant telah mencapai batas maksimal :limit pengguna sesuai paket langganan.',
    ],

    'invite' => [
        'button' => 'Undang Pengguna',
        'title' => 'Undang Pengguna ke Workspace',
        'desc' => 'Kirimkan email undangan untuk menambahkan pengguna yang sudah terdaftar di platform atau anggota baru.',
        'email_label' => 'Alamat Email',
        'email_placeholder' => 'nama@contoh.com',
        'role_label' => 'Peran (Role)',
        'role_select' => 'Pilih Peran',
        'submit' => 'Kirim Undangan',
        'sending' => 'Mengirim...',
        'cta_from_create' => 'Klik di sini untuk mengundang pengguna ini',
        'pending_title' => 'Undangan Tertunda',
        'pending_badge' => ':count tertunda',
        'pending_desc' => 'Daftar pengguna yang telah diundang dan belum menerima undangan bergabung.',
        'col_email' => 'Email Penerima',
        'col_role' => 'Peran yang Diberikan',
        'col_sent_at' => 'Tgl Dikirim',
        'col_expires_at' => 'Kedaluwarsa',
        'resend' => 'Kirim Ulang',
        'revoke' => 'Batalkan',
        'revoke_confirm_title' => 'Batalkan Undangan',
        'revoke_confirm_message' => 'Apakah Anda yakin ingin membatalkan undangan untuk :email? Tautan undangan ini tidak akan dapat digunakan lagi.',
        'no_pending' => 'Tidak ada undangan tertunda saat ini.',
    ],
];
