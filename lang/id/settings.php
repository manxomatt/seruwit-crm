<?php

return [
    'title' => 'Pengaturan',

    'fields' => [
        'key' => 'Kunci',
        'label' => 'Label',
        'group' => 'Grup',
        'type' => 'Tipe',
        'value' => 'Nilai',
        'description' => 'Deskripsi (opsional)',
        'sort_order' => 'Urutan',
        'is_public' => 'Jadikan pengaturan ini dapat diakses publik',
    ],

    'placeholders' => [
        'key' => 'Misal: site.name atau email.smtp_host',
        'key_hint' => 'Hanya huruf kecil, angka, garis bawah, dan titik yang diizinkan.',
        'label' => 'Misal: Nama Situs',
        'group' => 'Misal: shipping',
        'group_hint' => 'Hanya huruf kecil, angka, dan garis bawah yang diizinkan. Ini akan menjadi tab baru di Pengaturan.',
        'description' => 'Deskripsi singkat tentang fungsi pengaturan ini…',
        'color' => '#000000',
    ],

    'groups' => [
        'general' => 'Umum',
        'site' => 'Situs',
        'seo' => 'SEO',
        'appearance' => 'Tampilan',
        'email' => 'Email',
        'social' => 'Sosial',
        'units' => 'Satuan',
        'maintenance' => 'Maintenance',
    ],

    'types' => [
        'text' => 'Teks',
        'textarea' => 'Textarea',
        'boolean' => 'Boolean',
        'number' => 'Angka',
        'email' => 'Email',
        'url' => 'URL',
        'select' => 'Pilihan',
        'json' => 'JSON',
        'color' => 'Warna',
    ],

    'boolean_options' => [
        'true' => 'Ya / Benar',
        'false' => 'Tidak / Salah',
        'select_placeholder' => 'Pilih…',
    ],

    'pages' => [
        'index' => [
            'head' => 'Pengaturan',
        ],
        'group' => [
            'title' => 'Pengaturan — :group',
            'new_group' => '+ Grup Baru',
            'add_setting' => 'Tambah Pengaturan',
            'empty_title' => 'Belum ada pengaturan di grup ini',
            'empty_hint' => 'Tambahkan satu untuk memulai.',
            'save' => 'Simpan Perubahan',
            'reset_appearance' => 'Kembalikan ke Default',
            'enabled_label' => 'Aktif',
        ],
        'create' => [
            'title' => 'Buat Pengaturan',
            'head' => 'Buat Pengaturan',
            'submit' => 'Buat Pengaturan',
            'choose_existing_group' => 'Pilih grup yang sudah ada',
            'create_new_group' => '+ Buat grup baru',
        ],
        'edit' => [
            'title' => 'Ubah Pengaturan - :label',
            'head' => 'Ubah Pengaturan',
            'submit' => 'Perbarui Pengaturan',
        ],
    ],

    'value_display' => [
        'yes' => 'Ya',
        'no' => 'Tidak',
        'empty' => '—',
    ],

    'delete_confirm' => [
        'title' => 'Hapus Pengaturan',
        'message' => 'Apakah Anda yakin ingin menghapus ":label" (kunci: :key)? Tindakan ini tidak dapat dibatalkan.',
        'message_generic' => 'Apakah Anda yakin ingin menghapus pengaturan ini?',
    ],

    'reset_appearance_confirm' => [
        'title' => 'Reset Tampilan',
        'message' => 'Kembalikan semua pengaturan Appearance ke default sistem? Warna kustom, font, dark mode, CSS, dan JavaScript akan dihapus.',
    ],

    'validation' => [
        'key_required' => 'Kunci pengaturan wajib diisi.',
        'key_unique' => 'Kunci pengaturan ini sudah ada.',
        'key_regex' => 'Kunci pengaturan hanya boleh berisi huruf kecil, angka, garis bawah, dan titik.',
        'group_required' => 'Grup pengaturan wajib diisi.',
        'group_regex' => 'Grup hanya boleh berisi huruf kecil, angka, dan garis bawah.',
        'type_required' => 'Tipe pengaturan wajib diisi.',
        'type_in' => 'Tipe pengaturan harus salah satu dari: text, textarea, boolean, number, email, url, select, json, color.',
        'label_required' => 'Label pengaturan wajib diisi.',
    ],

    'messages' => [
        'created' => 'Pengaturan berhasil dibuat.',
        'updated' => 'Pengaturan berhasil diperbarui.',
        'deleted' => 'Pengaturan berhasil dihapus.',
        'bulk_updated' => 'Pengaturan berhasil diperbarui.',
        'appearance_reset' => 'Pengaturan Appearance dikembalikan ke default.',
    ],

    'mail' => [
        'title' => 'Server SMTP',
        'subtitle' => 'Gunakan akun SMTP milik Anda untuk email transaksi di workspace ini. Jika dinonaktifkan atau belum lengkap, mailer default platform yang dipakai.',
        'status_active' => 'SMTP tenant aktif — email keluar memakai kredensial ini.',
        'status_inactive' => 'SMTP tenant belum aktif — email keluar memakai mailer default platform.',
        'enabled' => 'Gunakan SMTP kustom untuk workspace ini',
        'host' => 'Host SMTP',
        'port' => 'Port',
        'encryption' => 'Enkripsi',
        'encryption_tls' => 'TLS',
        'encryption_ssl' => 'SSL',
        'encryption_none' => 'Tidak ada',
        'username' => 'Username',
        'password' => 'Password',
        'password_hint' => 'Kosongkan untuk mempertahankan password saat ini.',
        'save' => 'Simpan Pengaturan SMTP',
        'messages' => [
            'saved' => 'Pengaturan SMTP berhasil disimpan.',
        ],
        'validation' => [
            'host_required' => 'Host SMTP wajib diisi jika SMTP kustom diaktifkan.',
            'port_required' => 'Port SMTP wajib diisi jika SMTP kustom diaktifkan.',
            'username_required' => 'Username SMTP wajib diisi jika SMTP kustom diaktifkan.',
            'password_required' => 'Password SMTP wajib diisi saat SMTP kustom diaktifkan untuk pertama kali.',
        ],
    ],
];
