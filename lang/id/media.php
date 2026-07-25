<?php

return [
    'title' => 'Media',

    'fields' => [
        'alt_text' => 'Teks Alternatif',
        'description' => 'Deskripsi',
    ],

    'video_not_supported' => 'Browser Anda tidak mendukung tag video.',

    'placeholders' => [
        'search' => 'Cari media…',
        'alt_text' => 'Jelaskan gambar untuk aksesibilitas',
        'alt_text_hint' => 'Teks alternatif digunakan oleh pembaca layar dan ditampilkan saat gambar tidak dapat dimuat.',
        'description' => 'Tambahkan deskripsi untuk file media ini',
        'description_hint' => 'Deskripsi opsional untuk referensi internal.',
    ],

    'type' => [
        'image' => 'Gambar',
        'video' => 'Video',
        'document' => 'Dokumen',
        'all' => 'Semua Tipe',
        'images' => 'Gambar',
        'videos' => 'Video',
        'documents' => 'Dokumen',
    ],

    'pages' => [
        'index' => [
            'head' => 'Pustaka Media',
            'upload' => 'Unggah Media',
            'empty_title' => 'Belum ada file media',
            'empty_hint' => 'Mulai dengan mengunggah file media pertama Anda.',
            'select_all' => 'Pilih semua',
            'selected_count' => ':count item dipilih',
            'delete_selected' => 'Hapus Terpilih',
            'clear_selection' => 'Batalkan pilihan',
            'grid_view' => 'Tampilan Grid',
            'list_view' => 'Tampilan Daftar',
            'columns' => [
                'select' => 'Pilih',
                'preview' => 'Pratinjau',
                'name' => 'Nama',
                'type' => 'Tipe',
                'size' => 'Ukuran',
                'uploaded' => 'Diunggah',
            ],
        ],
        'create' => [
            'title' => 'Unggah Media',
            'head' => 'Unggah Media',
            'dropzone_hint' => 'Seret dan lepas file di sini, atau',
            'browse' => 'jelajahi',
            'supported_types' => 'Didukung: Gambar (JPEG, PNG, GIF, WebP, SVG), Video (MP4, WebM, MOV), Dokumen (PDF, DOC, DOCX, XLS, XLSX)',
            'max_size' => 'Ukuran file maksimum: 50MB',
            'files_count' => 'File (:count)',
            'clear_completed' => 'Bersihkan yang selesai (:count)',
            'upload_all' => 'Unggah Semua (:count)',
            'pending' => 'Menunggu',
            'retry' => 'Coba Lagi',
            'back' => 'Kembali ke Pustaka',
            'upload_failed' => 'Unggah gagal',
        ],
        'edit' => [
            'title' => 'Ubah: :name',
            'head' => 'Ubah Media',
            'preview' => 'Pratinjau',
            'details' => 'Ubah Detail',
            'file' => 'File',
            'type' => 'Tipe',
            'size' => 'Ukuran',
            'submit' => 'Simpan Perubahan',
            'back' => 'Kembali ke Pustaka',
        ],
        'show' => [
            'title' => 'Media: :name',
            'head' => 'Detail Media',
            'preview' => 'Pratinjau',
            'information' => 'Informasi File',
            'original_name' => 'Nama Asli',
            'file_name' => 'Nama File',
            'mime_type' => 'Tipe MIME',
            'size' => 'Ukuran',
            'alt_text' => 'Teks Alternatif',
            'description' => 'Deskripsi',
            'uploaded' => 'Diunggah',
            'last_modified' => 'Terakhir Diubah',
            'url' => 'URL',
            'copy' => 'Salin',
            'copied' => 'Tersalin!',
            'preview_unavailable' => 'Pratinjau tidak tersedia untuk jenis file ini',
            'download' => 'Unduh File',
            'back' => 'Kembali ke Pustaka',
        ],
    ],

    'actions' => [
        'edit' => 'Ubah',
        'delete' => 'Hapus',
        'view' => 'Pratinjau',
    ],

    'delete_confirm' => [
        'title' => 'Hapus Media',
        'message' => 'Apakah Anda yakin ingin menghapus file ":name"? Tindakan ini tidak dapat dibatalkan.',
        'message_generic' => 'Apakah Anda yakin ingin menghapus file ini?',
        'bulk_title' => 'Hapus Media Terpilih',
        'bulk_message' => 'Apakah Anda yakin ingin menghapus :count file yang dipilih? Tindakan ini tidak dapat dibatalkan.',
    ],

    'validation' => [
        'file_required' => 'Silakan pilih file untuk diunggah.',
        'file_invalid' => 'File yang diunggah tidak valid.',
        'file_max' => 'Ukuran file tidak boleh lebih dari 50MB.',
        'file_mimes' => 'Jenis file tidak didukung. Jenis yang diizinkan: gambar, dokumen, dan video.',
        'alt_text_max' => 'Teks alternatif tidak boleh lebih dari 255 karakter.',
        'description_max' => 'Deskripsi tidak boleh lebih dari 1000 karakter.',
    ],

    'messages' => [
        'created' => 'Media berhasil diunggah.',
        'updated' => 'Media berhasil diperbarui.',
        'deleted' => 'Media berhasil dihapus.',
        'bulk_deleted' => ':count file media berhasil dihapus.',
    ],
];
