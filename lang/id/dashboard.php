<?php

return [
    'title' => 'Dashboard',
    'title_with_role' => 'Dashboard :role',
    'welcome' => 'Selamat datang, :name!',
    'email' => 'Email',
    'roles' => 'Peran',
    'primary_role' => 'Peran Utama',

    'permissions' => [
        'title' => 'Izin Akses Anda',
        'empty' => 'Belum ada izin khusus yang diberikan. Hubungi administrator untuk akses.',
    ],

    'greeting' => [
        'morning' => 'Selamat Pagi',
        'afternoon' => 'Selamat Siang',
        'evening' => 'Selamat Malam',
    ],

    'periods' => [
        'today' => 'Hari ini',
        'week' => 'Minggu ini',
        'month' => 'Bulan ini',
    ],

    'period_delta' => [
        'today' => 'kemarin',
        'week' => 'minggu lalu',
        'month' => 'bulan lalu',
    ],

    'delta' => [
        'same' => 'Sama dengan :period',
        'diff' => ':sign:diff dari :period',
    ],

    'filters' => [
        'period' => 'Periode',
        'branch' => 'Cabang',
        'module' => 'Modul',
        'all_branches' => 'Semua Cabang',
        'all_modules' => 'Semua Modul',
    ],

    'kpi' => [
        'vs_previous' => 'vs periode lalu',
        'total_revenue' => 'Total Revenue (Semua)',
        'active_trips' => 'Trip aktif',
        'delivery_orders' => 'Delivery order',
        'revenue' => 'Revenue',
        'outstanding' => 'Belum Dibayar / Outstanding',
        'overdue_count' => ':count overdue',
        'overdue_invoices' => ':count Invoice Overdue',
        'fleet_utilization' => 'Utilisasi Armada',
        'unit_in_use' => ':in_use / :total_active Unit',
        'idle_ready' => ':count Unit Idle / Siap',
        'compliance' => 'Alert Kepatuhan',
        'action_needed' => ':count Perlu Tindakan',
        'document_expired' => ':count Dokumen Expired',
        'stnk_expiring' => ':count STNK Expired/Mau Habis',
        'maintenance_pending' => ':count Perlu Servis',
    ],

    'sections' => [
        'finance_invoice' => 'Performa Keuangan & Invoice',
        'revenue_per_line' => 'Pendapatan per Lini Bisnis',
        'invoice_status' => 'Status Invoice',
        'shuttle_ops' => 'Modul: Travel & Shuttle (Operasional Hari Ini)',
        'trip_status' => 'Status Keberangkatan',
        'occupancy' => 'Okupansi Kursi',
        'upcoming_departures' => 'Jadwal Keberangkatan Terdekat',
        'rental' => 'Modul: Rental Mobil',
        'rental_status' => 'Status Unit',
        'logistics' => 'Modul: Logistik & Kurir',
        'logistics_status' => 'Status Pengiriman',
        'fleet_global' => 'Monitoring Armada & Driver (Global Fleet)',
        'attention' => 'Perlu Perhatian & Aksi Cepat',
        'operational_alerts' => 'Operational Alerts',
        'quick_actions' => 'Aksi Cepat (Quick Actions)',
        'order_status' => 'Status delivery order',
        'alerts' => 'Peringatan',
        'monthly_revenue' => 'Revenue bulanan',
        'fleet' => 'Fleet',
        'top_partners' => 'Top partner (revenue)',
        'recent_activity' => 'Aktivitas terbaru',
        'invoices' => 'Invoice',
        'content' => 'Konten',
        'recent_content' => 'Konten terbaru',
        'access_permissions' => 'Izin akses Anda',
    ],

    'subscription' => [
        'title' => 'Paket & Harga per Kendaraan',
        'subtitle' => 'Harga PAYG otomatis mengikuti jumlah armada Anda',
        'current_tier' => 'Tier Aktif',
        'per_vehicle' => '/kendaraan',
        'monthly_estimate' => 'Estimasi Bulanan',
        'vehicles' => 'kendaraan',
        'billed_quota_note' => 'Berdasarkan kuota berlangganan Anda',
        'projected_note' => 'Perkiraan dari jumlah armada terdaftar',
        'your_tier' => 'Tier Anda',
        'unlimited' => 'Tanpa batas',
        'no_tier' => 'Belum ada armada terdaftar',
    ],

    'actions' => [
        'view_all' => 'Lihat semua',
        'manage' => 'Kelola',
        'all_partners' => 'Semua partner',
        'manage_invoices' => 'Kelola invoice',
    ],

    'finance' => [
        'line_rental' => 'Rental Mobil',
        'line_shuttle' => 'Travel / Shuttle',
        'line_logistics' => 'Logistik / Kurir',
        'line_other' => 'Lainnya',
    ],

    'invoice_status_summary' => [
        'draft' => 'Draft',
        'issued' => 'Issued',
        'paid' => 'Paid',
        'overdue' => 'Overdue',
    ],

    'shuttle' => [
        'total_trips_today' => 'Total Trip Hari Ini',
        'total_trips_unit' => 'Keberangkatan',
        'occupancy_label' => 'Okupansi Kursi',
        'occupancy_detail' => ':booked / :total Kursi',
        'seat_unit' => 'Kursi',
    ],

    'rental_unit' => [
        'currently_rented' => 'Sedang Disewa',
        'idle_ready' => 'Idle (Siap Sewa)',
        'overdue' => 'Sewa Terlambat (Overdue)',
        'unit_vehicles' => 'Unit',
    ],

    'logistics_unit' => [
        'total_resi_today' => 'Total Resi Hari Ini',
        'in_transit' => 'Dalam Pengiriman',
        'delivered_pod' => 'Terkirim (POD)',
        'unit_shipments' => 'Resi',
    ],

    'fleet_global' => [
        'active' => 'Armada Aktif',
        'maintenance' => 'Maintenance',
        'drivers_ready' => 'Driver Siap',
        'drivers_leave' => 'Driver Cuti',
        'fuel_consumption' => 'Konsumsi BBM',
        'unit_vehicles' => 'Unit',
        'unit_people' => 'Orang',
        'unit_liters' => 'Liter',
    ],

    'departure_status' => [
        'ready' => 'Siap Jalan',
        'locked' => 'Locked',
        'optimized' => 'Optimized',
        'boarding' => 'Boarding',
        'in_transit' => 'Dalam Perjalanan',
    ],

    'alerts' => [
        'rental_overdue_title' => '[Rental] Unit Terlambat Dikembalikan',
        'rental_overdue_message' => 'Unit :plate - Terlambat :hours jam dari jadwal',
        'shuttle_no_driver_title' => '[Travel] Belum Ada Driver',
        'shuttle_no_driver_message' => 'Trip :route (:time) - Belum ada driver di-assign',
        'stnk_expiring_title' => '[Armada] STNK Mau Habis',
        'stnk_expiring_message' => 'Pajak STNK :plate jatuh tempo dalam :days hari',
        'maintenance_overdue_title' => '[Maintenance] Servis Overdue',
        'invoice_overdue_title' => '[Invoice] Pembayaran Overdue',
    ],

    'quick_actions' => [
        'new_rental_reservation' => 'Reservasi Rental Baru',
        'issue_travel_ticket' => 'Issue Tiket Travel',
        'create_logistics_resi' => 'Buat Resi Logistik',
        'create_manual_invoice' => 'Buat Invoice Manual',
    ],

    'fleet' => [
        'active_vehicles' => 'Kendaraan aktif',
        'available_drivers' => 'Driver tersedia',
        'in_maintenance' => 'Dalam maintenance',
        'unit_vehicles' => 'kendaraan',
        'fuel_this_period' => 'BBM periode ini',
        'unit_liters' => 'liter',
    ],

    'order_status' => [
        'draft' => 'Draft',
        'confirmed' => 'Confirmed',
        'assigned' => 'Assigned',
        'in_transit' => 'In Transit',
        'delivered' => 'Delivered',
        'cancelled' => 'Cancelled',
    ],

    'vehicle_status' => [
        'active' => 'Aktif',
        'maintenance' => 'Maintenance',
        'inactive' => 'Nonaktif',
    ],

    'invoice_status' => [
        'draft' => 'Draft',
        'issued' => 'Issued',
        'paid' => 'Paid',
        'overdue' => 'Overdue',
    ],

    'content_stats' => [
        'posts' => 'Postingan',
        'pages' => 'Halaman',
        'media' => 'Media',
        'carousels' => 'Carousel',
        'published_draft' => ':published terbit, :draft draft',
        'media_detail' => ':images gambar, :documents dokumen',
        'active_count' => ':count aktif',
    ],

    'content_tabs' => [
        'posts' => 'Postingan',
        'pages' => 'Halaman',
    ],

    'status_labels' => [
        'published' => 'Terbit',
        'draft' => 'Draft',
    ],

    'time' => [
        'just_now' => 'Baru saja',
        'minutes_ago' => ':count menit lalu',
        'hours_ago' => ':count jam lalu',
        'days_ago' => ':count hari lalu',
    ],

    'activity' => [
        'do_delivered' => 'DO :code terkirim',
        'do_in_transit' => 'DO :code dalam pengiriman',
        'do_confirmed' => 'DO :code dikonfirmasi',
        'do_created' => 'DO :code dibuat',
        'trip_completed' => 'Trip :code selesai',
        'trip_started' => 'Trip :code dimulai',
        'trip_scheduled' => 'Trip :code dijadwalkan',
        'rental_completed' => 'Rental :code selesai',
        'rental_active' => 'Rental :code berjalan',
        'rental_confirmed' => 'Rental :code dikonfirmasi',
        'rental_created' => 'Rental :code dibuat',
        'shuttle_completed' => 'Keberangkatan :code selesai',
        'shuttle_in_transit' => 'Keberangkatan :code dalam perjalanan',
        'shuttle_dispatched' => 'Keberangkatan :code berangkat',
        'shuttle_created' => 'Keberangkatan :code dijadwalkan',
        'invoice_paid' => 'Invoice :code dibayar',
        'invoice_issued' => 'Invoice :code diterbitkan',
        'invoice_created' => 'Invoice :code dibuat',
        'wo_completed' => 'Servis selesai',
        'wo_created' => 'WO :ref: :title',
    ],
];
