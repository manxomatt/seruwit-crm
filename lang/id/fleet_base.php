<?php

return [
    'title' => 'Master Pool & Depo',
    'bases' => 'Pool & Depo',

    'nav' => [
        'list' => 'Master Pool & Depo',
    ],

    'status' => [
        'active' => 'Aktif',
        'inactive' => 'Nonaktif',
    ],

    'base_kinds' => [
        'depot' => 'Depo Utama',
        'yard' => 'Kantong Parkir / Pool Lapangan',
        'satellite' => 'Cabang Satelit',
        'workshop_base' => 'Pangkalan Bengkel',
    ],

    'messages' => [
        'base_created' => 'Pool / depo armada berhasil dibuat.',
        'base_updated' => 'Pool / depo armada berhasil diperbarui.',
        'base_deleted' => 'Pool / depo armada berhasil dihapus.',
        'base_in_use' => 'Pool / depo masih memiliki kendaraan terhubung dan tidak dapat dihapus.',
        'base_last_remaining' => 'Tidak dapat menghapus pool / depo karena ini adalah satu-satunya pool yang tersisa.',
        'bases_status_updated' => ':count pool / depo diubah ke :status.',
        'bases_batch_deleted' => ':count pool / depo dihapus.',
        'bases_batch_deleted_partial' => ':deleted pool dihapus. :blocked tidak bisa dihapus karena masih punya armada atau merupakan pool terakhir.',
        'bases_batch_delete_blocked' => 'Tidak ada pool terpilih yang bisa dihapus karena masih punya armada atau merupakan pool terakhir.',
        'limit_reached_bases' => 'Tenant telah mencapai batas maksimal :limit pool / depo sesuai paket langganan.',
        'base_create_forbidden_for_head' => 'Kepala Pool (Fleet Base Head) tidak diizinkan membuat pool baru. Hanya mengelola pool yang telah ditugaskan.',
        'base_delete_forbidden_for_head' => 'Kepala Pool (Fleet Base Head) tidak diizinkan menghapus pool / depo.',
    ],

    'validation' => [
        'closes_after_opens' => 'Jam tutup harus setelah jam buka.',
        'base_access_denied' => 'Anda tidak memiliki akses ke pool / depo ini.',
        'batch_ids_required' => 'Pilih minimal satu pool / depo.',
        'limit_reached_bases' => 'Tenant telah mencapai batas maksimal :limit pool / depo sesuai paket langganan.',
    ],
];
