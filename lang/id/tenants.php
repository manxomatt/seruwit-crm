<?php

return [
    'title' => 'Tenant',

    'fields' => [
        'company_name' => 'Nama Perusahaan',
        'subdomain' => 'Subdomain',
        'owner_name' => 'Nama Pemilik',
        'owner_email' => 'Email Pemilik',
        'owner_password' => 'Password Pemilik',
        'owner_password_hint' => '(kosongkan jika akun sudah ada)',
        'name' => 'Nama',
        'domain' => 'Domain',
        'members' => 'Anggota',
        'status' => 'Status',
        'created_at' => 'Dibuat',
        'plan' => 'Paket Langganan',
        'plan_hint' => 'Menurunkan paket hanya mencabut akses — modul yang sudah terpasang beserta datanya tetap utuh dan kembali begitu paketnya dinaikkan lagi.',
        'can_install_demo_data' => 'Izinkan instal data demo',
        'can_install_demo_data_hint' => 'Jika diaktifkan, workspace ini bisa memasang dan menghapus data sampel dari halaman Modul.',
        'billing_email' => 'Email Billing',
        'phone' => 'Telepon',
        'tax_id' => 'NPWP / Tax ID',
        'address' => 'Alamat',
        'notes' => 'Catatan Internal',
        'notes_hint' => '(hanya terlihat admin platform)',
        'confirm_name' => 'Ketik :name untuk mengonfirmasi',
    ],

    'status' => [
        'active' => 'Aktif',
        'suspended' => 'Ditangguhkan',
    ],

    'pages' => [
        'index' => [
            'head' => 'Tenant',
            'new' => 'Buat Tenant',
            'close_form' => 'Tutup Form',
            'create_heading' => 'Buat Tenant Baru',
            'submit' => 'Buat Tenant',
            'empty_title' => 'Belum ada tenant',
            'empty_hint' => 'Mulai dengan membuat workspace pertama untuk pelanggan.',
            'columns' => [
                'name' => 'Nama',
                'domain' => 'Domain',
                'members' => 'Anggota',
                'status' => 'Status',
                'created_at' => 'Dibuat',
                'actions' => 'Aksi',
            ],
        ],

        'show' => [
            'head_title' => 'Tenant: :name',
            'members_heading' => 'Anggota',
            'member_columns' => [
                'name' => 'Nama',
                'email' => 'Email',
                'roles' => 'Peran',
            ],
            'no_members' => 'Belum ada anggota.',
            'edit_heading' => 'Edit Detail',
            'subdomain_warning' => 'Mengubah subdomain akan mengganti URL workspace ini — tautan lama akan berhenti bekerja.',
            'profile_heading' => 'Profil & Kontak',
            'modules_heading' => 'Modul',
            'modules_hint' => 'Apa yang boleh dipasang ditentukan paket di atas. Mencopot modul tidak menghapus datanya — data disimpan :days hari sebelum dihapus permanen.',
            'no_modules' => 'Belum ada modul opsional yang terdaftar.',
            'module_states' => [
                'installed' => 'Terpasang',
                'available' => 'Tersedia',
                'uninstalled' => 'Dicopot',
                'locked' => 'Di luar paket',
                'locked_with_data' => 'Terkunci, data tersimpan',
                'disabled' => 'Dinonaktifkan',
                'disabled_with_data' => 'Dinonaktifkan',
            ],
            'purges_at' => 'Data dihapus permanen pada :date.',
            'module_disabled_hint' => 'Modul ini dinonaktifkan platform untuk semua tenant.',
            'module_disabled_with_data_hint' => 'Modul ini dinonaktifkan platform untuk semua tenant — datanya tetap tersimpan.',
            'plans_offering_hint' => 'Ada di paket :plans — pindahkan paketnya untuk membuka.',
            'danger_zone' => 'Zona Bahaya',
            'danger_zone_hint' => 'Menghapus tenant akan menghapus permanen seluruh datanya (schema database, pengguna, konten). Tindakan ini tidak dapat dibatalkan.',
        ],
    ],

    'actions' => [
        'suspend' => 'Tangguhkan',
        'activate' => 'Aktifkan',
        'view_detail' => 'Detail',
        'install' => 'Pasang',
        'uninstall' => 'Copot',
        'save_changes' => 'Simpan Perubahan',
        'delete_permanently' => 'Hapus Tenant Permanen',
    ],

    'validation' => [
        'subdomain_format' => 'Subdomain hanya boleh berisi huruf kecil, angka, dan tanda hubung (3–30 karakter).',
        'subdomain_reserved' => 'Subdomain ini tidak tersedia.',
        'subdomain_taken' => 'Subdomain ini sudah digunakan.',
    ],

    'messages' => [
        'created' => 'Tenant berhasil dibuat.',
        'updated' => 'Detail tenant diperbarui.',
        'status_updated' => 'Status tenant diperbarui.',
        'deleted' => 'Tenant beserta seluruh datanya telah dihapus.',
        'confirm_name_mismatch' => 'Nama konfirmasi tidak cocok dengan nama tenant.',
        'module_installed' => 'Modul :module dipasang untuk :tenant.',
        'module_uninstalled' => 'Modul :module dicopot dari :tenant. Datanya disimpan :days hari.',
    ],
];
