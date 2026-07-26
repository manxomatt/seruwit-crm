<?php

return [
    'title' => 'Mitra',

    'status' => [
        'active' => 'Aktif',
        'inactive' => 'Nonaktif',
        'all' => 'Semua status',
    ],

    'account_type' => [
        'company' => 'Perusahaan',
        'individual' => 'Individu',
        'all' => 'Semua tipe',
    ],

    'role' => [
        'customer' => 'Customer',
        'supplier' => 'Supplier',
        'all' => 'Semua peran',
    ],

    'address_type' => [
        'shipping' => 'Pengiriman',
        'billing' => 'Penagihan',
        'warehouse' => 'Gudang',
    ],

    'fields' => [
        'account_type' => 'Tipe Akun',
        'name' => 'Nama',
        'title' => 'Gelar',
        'job_title' => 'Jabatan',
        'parent_company' => 'Perusahaan Induk',
        'phone' => 'Telepon',
        'mobile' => 'Mobile / WhatsApp',
        'email' => 'Email',
        'website' => 'Website',
        'industry' => 'Industri',
        'tax_id' => 'NPWP',
        'credit_limit' => 'Batas Kredit',
        'price_list' => 'Daftar Harga',
        'tags' => 'Tag',
        'address' => 'Alamat Utama',
        'notes' => 'Catatan',
        'comment' => 'Komentar Internal',
        'status' => 'Status',
        'type' => 'Tipe',
        'label' => 'Label',
        'street' => 'Alamat',
        'city' => 'Kota',
        'province' => 'Provinsi',
        'zip' => 'Kode Pos',
        'country' => 'Negara',
        'bank_name' => 'Nama Bank',
        'account_number' => 'No. Rekening',
        'account_holder' => 'Pemilik Rekening',
        'is_default' => 'Default',
        'code' => 'Kode',
    ],

    'placeholders' => [
        'search' => 'Cari nama, kode, telepon, email, NPWP…',
        'select_title' => 'Pilih gelar',
        'select_company' => 'Pilih perusahaan',
        'select_industry' => 'Pilih industri',
        'address_label' => 'Misal: Kantor Pusat',
        'none' => 'Tidak ada',
    ],

    'index' => [
        'head' => 'Mitra',
        'new' => 'Tambah Partner',
        'empty_title' => 'Belum ada partner',
        'empty_hint' => 'Mulai dengan menambahkan partner baru.',
        'columns' => [
            'code' => 'Kode',
            'name' => 'Nama',
            'role' => 'Peran',
            'phone' => 'Telepon',
            'industry' => 'Industri',
            'status' => 'Status',
        ],
        'delete_title' => 'Hapus Partner',
        'delete_confirm' => 'Yakin ingin menghapus ":name" (:code)? Tindakan ini tidak dapat dibatalkan.',
        'delete_confirm_generic' => 'Yakin ingin menghapus partner ini?',
    ],

    'create' => [
        'title' => 'Tambah Partner',
        'head' => 'Tambah Partner',
        'submit' => 'Simpan Partner',
    ],

    'edit' => [
        'title' => 'Edit :name',
        'head' => 'Edit Partner',
        'submit' => 'Simpan Perubahan',
    ],

    'show' => [
        'general' => 'Informasi Umum',
        'contact' => 'Kontak',
        'contacts' => 'Kontak Person',
        'addresses' => 'Alamat',
        'bank_accounts' => 'Rekening Bank',
        'notes_section' => 'Catatan',
        'add_address' => '+ Tambah Alamat',
        'add_bank_account' => '+ Tambah Rekening',
        'save_address' => 'Simpan Alamat',
        'save_bank_account' => 'Simpan Rekening',
        'empty_addresses' => 'Belum ada alamat.',
        'empty_bank_accounts' => 'Belum ada rekening bank.',
        'delete_zone_title' => 'Hapus partner ini',
        'delete_zone_hint' => 'Tindakan ini tidak dapat dibatalkan.',
        'delete_action' => 'Hapus Partner',
        'delete_title' => 'Hapus Partner',
        'delete_confirm' => 'Yakin ingin menghapus ":name" (:code)? Tindakan ini tidak dapat dibatalkan.',
        'delete_address_title' => 'Hapus Alamat',
        'delete_address_confirm' => 'Yakin ingin menghapus alamat ini (:detail)? Tindakan ini tidak dapat dibatalkan.',
        'delete_bank_account_title' => 'Hapus Rekening Bank',
        'delete_bank_account_confirm' => 'Yakin ingin menghapus rekening :bank dengan nomor akhir :account? Tindakan ini tidak dapat dibatalkan.',
        'bank_columns' => [
            'bank' => 'Bank',
            'account_number' => 'No. Rekening',
            'account_holder' => 'Pemilik Rekening',
        ],
    ],

    'validation' => [
        'account_type_in' => 'Tipe akun harus perusahaan atau individu.',
        'status_in' => 'Pilih status yang valid.',
    ],

    'messages' => [
        'created' => 'Partner berhasil dibuat.',
        'updated' => 'Partner berhasil diperbarui.',
        'deleted' => 'Partner berhasil dihapus.',
        'delete_referenced' => 'Partner ini masih direferensikan oleh data lain dan tidak dapat dihapus.',
        'address_created' => 'Alamat berhasil ditambahkan.',
        'address_deleted' => 'Alamat berhasil dihapus.',
        'bank_account_created' => 'Rekening bank berhasil ditambahkan.',
        'bank_account_deleted' => 'Rekening bank berhasil dihapus.',
    ],
];
