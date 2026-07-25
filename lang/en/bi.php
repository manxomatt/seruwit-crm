<?php

return [
    'title' => 'Executive Dashboard',
    'subtitle' => 'OTD · fleet utilization · AR aging · turnover · revenue per route',

    'periods' => [
        'today' => 'Today',
        'week' => 'This week',
        'month' => 'This month',
    ],

    'unavailable' => 'Source module not installed',

    'delta' => [
        'same' => 'Same vs previous period',
        'change' => ':sign:diff:unit vs previous period',
    ],

    'kpis' => [
        'otd' => 'OTD Rate',
        'otd_subtitle' => ':on_time/:with_sla on-time · :delivered delivered',
        'fleet' => 'Fleet Utilization',
        'fleet_subtitle' => ':trip_days trip-days / :capacity_days capacity',
        'aging' => 'Aging AR (Overdue)',
        'aging_subtitle' => ':count invoice(s) · outstanding :amount',
        'inventory' => 'Inventory Turnover',
        'inventory_subtitle' => 'COGS :cogs / stock :stock',
        'revenue' => 'Revenue / Route',
        'revenue_subtitle' => ':count route(s) · total :total',
    ],

    'sections' => [
        'aging' => 'AR Aging Buckets',
        'aging_unavailable' => 'Install Receivables & Invoicing to view aging.',
        'delivery' => 'Delivery Performance',
        'delivery_unavailable' => 'Install the Orders module for OTD.',
        'delivery_empty' => 'No delivered DOs with promised_at in this period yet.',
        'on_time' => 'On time',
        'late' => 'Late',
        'delivered' => 'Delivered',
        'fleet' => 'Fleet Snapshot',
        'fleet_unavailable' => 'Install the Fleet module for utilization.',
        'active_vehicles' => 'Active vehicles',
        'inventory' => 'Inventory',
        'inventory_unavailable' => 'Install Inventory & Products for turnover.',
        'cogs' => 'COGS (period)',
        'stock_value' => 'Current stock value',
        'out_qty' => 'Qty out',
        'turnover' => 'Turnover',
        'revenue' => 'Top Revenue per Route',
        'revenue_unavailable' => 'Install the Routing module for revenue per route.',
        'revenue_no_billing' => 'Routing is available, but Billing is not installed — charge revenue cannot be calculated.',
        'revenue_empty' => 'No applied route plans in this period yet.',
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
        'date' => 'Date',
        'vehicle' => 'Vehicle',
        'stops' => 'Stops',
        'km' => 'Km',
        'revenue' => 'Revenue',
    ],

    'notes' => [
        'transportation_required' => 'Install Transportation to measure trip-day utilization.',
    ],
];
