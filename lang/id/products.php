<?php

return [
    'title' => 'Produk',

    'nav' => [
        'products' => 'Products',
        'principals' => 'Principals',
        'brands' => 'Brands',
        'product_types' => 'Tipe Produk',
        'attributes' => 'Atribut',
        'tags' => 'Tags',
    ],

    'status' => [
        'active' => 'Aktif',
        'inactive' => 'Nonaktif',
        'all' => 'Semua status',
    ],

    'categories' => [
        'merchandise' => 'Merchandise',
        'fleet_sparepart' => 'Sparepart',
        'service' => 'Service',
        'all' => 'Semua kategori',
    ],

    'tracking' => [
        'qty' => 'By Quantity',
        'serial' => 'By Serial',
        'lot' => 'By Lot',
        'none' => 'No Tracking',
    ],

    'attribute_types' => [
        'select' => 'Select',
        'color' => 'Color',
        'radio' => 'Radio',
        'checkbox' => 'Checkbox',
    ],

    'tag_colors' => [
        'none' => 'Tanpa warna',
        'red' => 'Merah',
        'blue' => 'Biru',
        'green' => 'Hijau',
        'yellow' => 'Kuning',
        'purple' => 'Ungu',
        'orange' => 'Oranye',
        'pink' => 'Pink',
        'gray' => 'Abu-abu',
    ],

    'fields' => [
        'name' => 'Nama',
        'code' => 'Kode',
        'sku' => 'SKU',
        'barcode' => 'Barcode',
        'brand' => 'Brand',
        'principal' => 'Principal',
        'product_type' => 'Tipe Produk',
        'category' => 'Kategori',
        'status' => 'Status',
        'tracking' => 'Tracking',
        'unit' => 'Satuan',
        'price' => 'Harga',
        'cost' => 'HPP',
        'description' => 'Deskripsi',
        'notes' => 'Catatan',
        'parent' => 'Induk',
        'color' => 'Warna',
        'type' => 'Tipe',
        'options' => 'Opsi',
        'is_inventoried' => 'Diinventarisasi',
        'min_stock' => 'Stok Min',
        'max_stock' => 'Stok Max',
        'weight' => 'Berat',
        'packagings' => 'Packaging',
        'attributes' => 'Atribut',
        'tags' => 'Tags',
        'contact' => 'Kontak',
        'phone' => 'Telepon',
        'email' => 'Email',
        'address' => 'Alamat',
        'contact_name' => 'Nama Kontak',
        'sort_order' => 'Urutan',
        'sub_type' => 'Sub-Tipe',
        'volume' => 'Volume (m³)',
        'variants' => 'Varian',
    ],

    'placeholders' => [
        'search' => 'Cari nama, kode, SKU…',
        'select_brand' => 'Pilih brand',
        'select_principal' => 'Pilih principal',
        'select_type' => 'Pilih tipe',
        'select_parent' => 'Pilih induk (opsional)',
        'optional' => 'Opsional',
    ],

    'products' => [
        'index' => [
            'head' => 'Products',
            'new' => 'Tambah Produk',
            'empty' => 'Belum ada produk.',
            'columns' => [
                'code' => 'Kode',
                'name' => 'Nama',
                'brand' => 'Brand',
                'category' => 'Kategori',
                'status' => 'Status',
            ],
            'delete_title' => 'Hapus Product',
            'delete_confirm' => 'Yakin ingin menghapus ":name" (:code)?',
        ],
        'create' => [
            'title' => 'Tambah Produk',
            'submit' => 'Simpan Produk',
        ],
        'edit' => [
            'title' => 'Edit :name',
            'submit' => 'Simpan Perubahan',
        ],
        'show' => [
            'edit' => 'Edit',
            'back' => 'Kembali ke Daftar',
            'general' => 'Umum',
            'inventory' => 'Inventori',
            'pricing' => 'Harga',
            'packagings' => 'Packaging',
            'attributes' => 'Atribut',
            'tags' => 'Tags',
            'delete_zone_title' => 'Hapus produk ini',
            'delete_zone_hint' => 'Tindakan ini tidak dapat dibatalkan.',
            'delete_action' => 'Hapus Produk',
            'delete_title' => 'Hapus Product',
            'delete_confirm' => 'Yakin ingin menghapus ":name" (:code)?',
        ],
    ],

    'brands' => [
        'index' => [
            'head' => 'Brands',
            'new' => 'Tambah Brand',
            'empty' => 'Belum ada brand.',
            'columns' => [
                'name' => 'Nama',
                'principal' => 'Principal',
                'status' => 'Status',
            ],
            'delete_title' => 'Hapus Brand',
            'delete_confirm' => 'Yakin ingin menghapus brand ":name"?',
        ],
        'create' => [
            'title' => 'Tambah Brand',
            'submit' => 'Simpan Brand',
        ],
        'edit' => [
            'title' => 'Edit Brand',
            'submit' => 'Simpan Perubahan',
        ],
    ],

    'principals' => [
        'index' => [
            'head' => 'Principals',
            'new' => 'Tambah Principal',
            'empty' => 'Belum ada principal.',
            'columns' => [
                'name' => 'Nama',
                'code' => 'Kode',
                'status' => 'Status',
            ],
            'delete_title' => 'Hapus Principal',
            'delete_confirm' => 'Yakin ingin menghapus ":name"? Tindakan ini tidak bisa dibatalkan.',
        ],
        'create' => [
            'title' => 'Tambah Principal',
            'submit' => 'Simpan Principal',
        ],
        'edit' => [
            'title' => 'Edit Principal',
            'submit' => 'Simpan Perubahan',
        ],
    ],

    'product_types' => [
        'index' => [
            'head' => 'Tipe Produk',
            'new' => 'Tambah Tipe',
            'empty' => 'Belum ada tipe produk.',
            'columns' => [
                'name' => 'Nama',
                'parent' => 'Induk',
            ],
            'delete_title' => 'Hapus Tipe Produk',
            'delete_confirm' => 'Yakin ingin menghapus tipe ":name"?',
        ],
        'create' => [
            'title' => 'Tambah Tipe Produk',
            'submit' => 'Simpan Tipe',
        ],
        'edit' => [
            'title' => 'Edit Tipe Produk',
            'submit' => 'Simpan Perubahan',
        ],
    ],

    'attributes' => [
        'index' => [
            'head' => 'Atribut Produk',
            'new' => 'Tambah Atribut',
            'empty' => 'Belum ada atribut.',
            'columns' => [
                'name' => 'Nama',
                'type' => 'Tipe',
                'options' => 'Opsi',
            ],
            'delete_title' => 'Hapus Atribut',
            'delete_confirm' => 'Yakin ingin menghapus atribut ":name"? Semua opsi akan ikut terhapus.',
        ],
        'create' => [
            'title' => 'Tambah Atribut',
            'submit' => 'Simpan Atribut',
            'add_option' => 'Tambah Opsi',
        ],
        'edit' => [
            'title' => 'Edit Atribut',
            'submit' => 'Simpan Perubahan',
            'add_option' => 'Tambah Opsi',
        ],
    ],

    'tags' => [
        'index' => [
            'head' => 'Tags',
            'new' => 'Tambah Tag',
            'empty' => 'Belum ada tag.',
            'columns' => [
                'name' => 'Nama',
                'color' => 'Warna',
            ],
            'delete_title' => 'Hapus Tag',
            'delete_confirm' => 'Yakin ingin menghapus tag ":name"?',
        ],
        'create' => [
            'title' => 'Tambah Tag',
            'submit' => 'Simpan Tag',
        ],
        'edit' => [
            'title' => 'Edit Tag',
            'submit' => 'Simpan Perubahan',
        ],
    ],

    'validation' => [
        'status_in' => 'Pilih status produk yang valid.',
        'category_in' => 'Pilih kategori inventori yang valid.',
    ],

    'messages' => [
        'product_created' => 'Produk berhasil dibuat.',
        'product_updated' => 'Produk berhasil diperbarui.',
        'product_deleted' => 'Produk berhasil dihapus.',
        'product_referenced' => 'Produk ini masih direferensikan oleh data lain dan tidak dapat dihapus.',
        'brand_created' => 'Brand berhasil dibuat.',
        'brand_updated' => 'Brand berhasil diperbarui.',
        'brand_deleted' => 'Brand berhasil dihapus.',
        'brand_has_products' => 'Brand masih memiliki produk dan tidak bisa dihapus.',
        'principal_created' => 'Principal berhasil dibuat.',
        'principal_updated' => 'Principal berhasil diperbarui.',
        'principal_deleted' => 'Principal berhasil dihapus.',
        'principal_has_brands' => 'Principal masih memiliki brand dan tidak bisa dihapus.',
        'type_created' => 'Tipe produk berhasil dibuat.',
        'type_updated' => 'Tipe produk berhasil diperbarui.',
        'type_deleted' => 'Tipe produk berhasil dihapus.',
        'type_has_products' => 'Tipe produk masih digunakan oleh produk dan tidak bisa dihapus.',
        'type_has_children' => 'Tipe produk masih memiliki sub-tipe dan tidak bisa dihapus.',
        'attribute_created' => 'Atribut berhasil dibuat.',
        'attribute_updated' => 'Atribut berhasil diperbarui.',
        'attribute_deleted' => 'Atribut berhasil dihapus.',
        'tag_created' => 'Tag berhasil dibuat.',
        'tag_updated' => 'Tag berhasil diperbarui.',
        'tag_deleted' => 'Tag berhasil dihapus.',
        'tag_in_use' => 'Tag masih digunakan oleh produk dan tidak bisa dihapus.',
    ],
];
