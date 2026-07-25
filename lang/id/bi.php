<?php

return [
    'title' => 'Dashboard Eksekutif',
    'subtitle' => 'OTD · utilisasi armada · aging AR · turnover · revenue per rute',

    'periods' => [
        'today' => 'Hari ini',
        'week' => 'Minggu ini',
        'month' => 'Bulan ini',
    ],

    'unavailable' => 'Modul sumber belum terpasang',

    'delta' => [
        'same' => 'Sama vs periode lalu',
        'change' => ':sign:diff:unit vs periode lalu',
    ],

    'kpis' => [
        'otd' => 'OTD Rate',
        'otd_subtitle' => ':on_time/:with_sla on-time · :delivered delivered',
        'fleet' => 'Utilisasi Armada',
        'fleet_subtitle' => ':trip_days trip-days / :capacity_days kapasitas',
        'aging' => 'Aging AR (Overdue)',
        'aging_subtitle' => ':count invoice · outstanding :amount',
        'inventory' => 'Inventory Turnover',
        'inventory_subtitle' => 'COGS :cogs / stok :stock',
        'revenue' => 'Revenue / Rute',
        'revenue_subtitle' => ':count rute · total :total',
    ],

    'sections' => [
        'aging' => 'Bucket Aging AR',
        'aging_unavailable' => 'Pasang modul Receivables & Invoicing untuk melihat aging.',
        'delivery' => 'Performa Pengiriman',
        'delivery_unavailable' => 'Pasang modul Orders untuk OTD.',
        'delivery_empty' => 'Belum ada DO delivered dengan promised_at di periode ini.',
        'on_time' => 'On time',
        'late' => 'Late',
        'delivered' => 'Delivered',
        'fleet' => 'Snapshot Armada',
        'fleet_unavailable' => 'Pasang modul Fleet untuk utilisasi.',
        'active_vehicles' => 'Kendaraan aktif',
        'inventory' => 'Inventori',
        'inventory_unavailable' => 'Pasang Inventory & Products untuk turnover.',
        'cogs' => 'COGS (periode)',
        'stock_value' => 'Nilai stok saat ini',
        'out_qty' => 'Qty keluar',
        'turnover' => 'Turnover',
        'revenue' => 'Top Revenue per Rute',
        'revenue_unavailable' => 'Pasang modul Routing untuk revenue per rute.',
        'revenue_no_billing' => 'Routing tersedia, tapi Billing belum terpasang — revenue charge tidak dapat dihitung.',
        'revenue_empty' => 'Belum ada route plan applied di periode ini.',
    ],

    'buckets' => [
        'current' => 'Current',
        '1_30' => '1–30',
        '31_60' => '31–60',
        '61_90' => '61–90',
        '90_plus' => '90+',
    ],

    'table' => [
        'plan' => 'Plan',
        'date' => 'Tanggal',
        'vehicle' => 'Kendaraan',
        'stops' => 'Stops',
        'km' => 'Km',
        'revenue' => 'Revenue',
    ],

    'notes' => [
        'transportation_required' => 'Pasang Transportation untuk mengukur utilisasi trip-day.',
    ],
];
