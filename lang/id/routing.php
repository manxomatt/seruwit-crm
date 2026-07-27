<?php

return [
    'title' => 'Optimasi Rute',

    'status' => [
        'all' => 'Semua status',
        'draft' => 'Draft',
        'optimized' => 'Dioptimasi',
        'applied' => 'Diterapkan',
        'cancelled' => 'Dibatalkan',
    ],

    'objective' => [
        'fuel_cost' => 'Minimalkan biaya BBM',
        'distance' => 'Minimalkan jarak',
    ],

    'fields' => [
        'code' => 'Kode',
        'date' => 'Tanggal',
        'plan_date' => 'Tanggal rencana',
        'objective' => 'Objektif',
        'distance' => 'Jarak',
        'cost' => 'Biaya',
        'status' => 'Status',
        'depot_address' => 'Alamat depot',
        'depot_lat' => 'Latitude depot',
        'depot_lng' => 'Longitude depot',
        'vehicle' => 'Kendaraan',
        'driver' => 'Driver',
        'total_distance' => 'Total jarak',
        'estimated_cost' => 'Estimasi biaya',
        'routes' => 'Rute',
        'unassigned' => 'Belum terassign',
        'geocoded_dos' => 'DO ter-geocode',
        'missing_coords' => 'Koordinat kurang',
        'active_vehicles' => 'Kendaraan aktif',
        'available_drivers' => 'Driver tersedia',
    ],

    'actions' => [
        'new_plan' => 'Rencana Baru',
        'optimize_routes' => 'Optimasi rute',
        're_optimize' => 'Optimasi ulang',
        'apply_create_trips' => 'Terapkan → buat trip',
        'cancel_plan' => 'Batalkan rencana',
        'back' => 'Kembali',
    ],

    'pages' => [
        'index' => [
            'title' => 'Rencana Rute',
            'head' => 'Optimasi Rute',
            'intro' => 'Mesin VRP — assign driver dan kendaraan otomatis untuk meminimalkan jarak dan biaya BBM.',
            'empty' => 'Belum ada rencana rute.',
            'unassigned' => ':count belum terassign',
        ],
        'create' => [
            'title' => 'Rencana Rute Baru',
            'orders_section' => 'Delivery order terkonfirmasi',
            'orders_hint' => 'Hanya order dengan koordinat pengiriman yang dapat dioptimasi. Tambahkan lat/lng di form order.',
            'orders_empty' => 'Tidak ada order terkonfirmasi pada tanggal ini.',
            'missing_coordinates' => 'Koordinat kurang',
        ],
        'show' => [
            'depot' => 'Depot: :address (:lat, :lng)',
            'routes_empty' => 'Tidak ada rute dihasilkan. Periksa kapasitas kendaraan, ketersediaan driver, dan koordinat order.',
            'route_heading' => 'Rute #:sequence',
            'route_meta' => ':distance km · biaya :cost · muatan :load kg',
            'route_trip' => ' · trip #:id',
            'stop_fallback' => 'Stop',
            'stop_meta' => '+:distance km · :demand kg · :lat, :lng',
            'map_title' => 'Peta rute',
            'map_depot' => 'Depot',
            'map_route_legend' => 'Rute #:sequence · :vehicle',
            'map_stop_popup' => 'Rute #:sequence · stop #:stop',
        ],
    ],

    'defaults' => [
        'depot_address' => 'Depot',
    ],

    'messages' => [
        'plan_optimized' => 'Rencana :code dioptimasi.',
        'plan_re_optimized' => 'Rencana dioptimasi ulang.',
        'trips_created' => 'Trip dibuat dan delivery order di-assign.',
        'plan_cancelled' => 'Rencana dibatalkan.',
        'route_assignment_updated' => 'Assignment rute diperbarui.',
        'directions_failed' => 'Tidak dapat menggambar rute jalan untuk stop ini.',
        'directions_need_points' => 'Minimal dua koordinat diperlukan untuk menggambar rute.',
    ],

    'errors' => [
        'cannot_reoptimize' => 'Rencana yang sudah diterapkan atau dibatalkan tidak dapat dioptimasi ulang.',
        'applied_cannot_cancel' => 'Rencana yang sudah diterapkan tidak dapat dibatalkan.',
        'only_optimized_editable' => 'Hanya rencana yang sudah dioptimasi yang dapat diedit.',
        'only_optimized_applicable' => 'Hanya rencana yang sudah dioptimasi yang dapat diterapkan.',
        'no_routes_to_apply' => 'Rencana tidak memiliki rute untuk diterapkan.',
        'route_needs_vehicle_driver' => 'Setiap rute membutuhkan kendaraan dan driver sebelum diterapkan.',
        'order_not_confirmed' => 'Order :code tidak lagi berstatus terkonfirmasi.',
    ],

    'validation' => [
        'depot_lat_required' => 'Latitude depot wajib untuk routing.',
        'depot_lng_required' => 'Longitude depot wajib untuk routing.',
        'objective_in' => 'Pilih jarak atau biaya BBM sebagai objektif.',
    ],
];
