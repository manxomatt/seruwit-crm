<?php

return [
    'title' => 'Post',

    'status' => [
        'published' => 'Published',
        'draft' => 'Draft',
    ],

    'fields' => [
        'title' => 'Judul Post',
        'slug' => 'URL Slug',
        'excerpt' => 'Ringkasan',
        'content' => 'Konten',
        'featured_image' => 'URL Gambar Utama',
        'published' => 'Published',
        'published_date' => 'Tanggal Publish',
    ],

    'placeholders' => [
        'title' => 'Masukkan judul post',
        'slug' => 'slug-url-post',
        'excerpt' => 'Ringkasan singkat post…',
        'content' => 'Tulis konten post di sini…',
        'featured_image' => 'https://example.com/image.jpg',
    ],

    'hints' => [
        'excerpt' => 'Ringkasan singkat yang muncul di daftar post.',
        'featured_image' => 'URL gambar utama untuk post ini.',
        'slug_prefix' => '/blog/',
    ],

    'index' => [
        'head' => 'Post',
        'create' => 'Buat Post',
        'empty_title' => 'Belum ada post',
        'empty_hint' => 'Mulai dengan membuat blog post pertama Anda.',
        'columns' => [
            'title' => 'Judul',
            'slug' => 'Slug',
            'status' => 'Status',
            'published' => 'Published',
        ],
        'preview' => 'Pratinjau',
        'delete_title' => 'Hapus Post',
        'delete_confirm' => 'Yakin ingin menghapus post ":title"? Tindakan ini tidak dapat dibatalkan.',
        'delete_confirm_generic' => 'Yakin ingin menghapus post ini?',
    ],

    'create' => [
        'title' => 'Buat Post Baru',
        'head' => 'Buat Post',
        'publish_immediately' => 'Publish segera',
        'creating' => 'Membuat…',
        'submit' => 'Buat Post',
    ],

    'edit' => [
        'head' => 'Edit Post',
        'title' => 'Edit: :title',
        'last_updated' => 'Terakhir diperbarui: :time',
        'published_on' => 'Dipublish pada: :date',
        'preview' => 'Pratinjau',
        'saving' => 'Menyimpan…',
        'submit' => 'Simpan Perubahan',
    ],

    'show' => [
        'head' => 'Pratinjau Post',
        'title' => 'Pratinjau: :title',
        'last_updated' => 'Terakhir diperbarui: :time',
        'edit_post' => 'Edit Post',
        'back' => 'Kembali ke Post',
        'empty_content' => 'Belum ada konten.',
        'add_content' => 'Tambah konten →',
    ],

    'validation' => [
        'title_required' => 'Judul post wajib diisi.',
        'title_max' => 'Judul post maksimal 255 karakter.',
        'slug_required' => 'Slug post wajib diisi.',
        'slug_unique' => 'Slug ini sudah digunakan.',
        'excerpt_max' => 'Ringkasan maksimal 500 karakter.',
    ],

    'messages' => [
        'updated' => 'Post berhasil diperbarui.',
        'deleted' => 'Post berhasil dihapus.',
    ],
];
