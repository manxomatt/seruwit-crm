<?php

return [
    'title' => 'Dashboard',
    'title_with_role' => ':role Dashboard',
    'welcome' => 'Welcome, :name!',
    'email' => 'Email',
    'roles' => 'Roles',
    'primary_role' => 'Primary Role',

    'permissions' => [
        'title' => 'Your Permissions',
        'empty' => 'No specific permissions assigned. Contact an administrator for access.',
    ],

    'greeting' => [
        'morning' => 'Good Morning',
        'afternoon' => 'Good Afternoon',
        'evening' => 'Good Evening',
    ],

    'periods' => [
        'today' => 'Today',
        'week' => 'This Week',
        'month' => 'This Month',
    ],

    'period_delta' => [
        'today' => 'yesterday',
        'week' => 'last week',
        'month' => 'last month',
    ],

    'delta' => [
        'same' => 'Same as :period',
        'diff' => ':sign:diff from :period',
    ],

    'filters' => [
        'period' => 'Period',
        'branch' => 'Branch',
        'module' => 'Module',
        'all_branches' => 'All Branches',
        'all_modules' => 'All Modules',
    ],

    'kpi' => [
        'vs_previous' => 'vs previous',
        'total_revenue' => 'Total Revenue (All)',
        'active_trips' => 'Active trips',
        'delivery_orders' => 'Delivery orders',
        'revenue' => 'Revenue',
        'outstanding' => 'Unpaid / Outstanding',
        'overdue_count' => ':count overdue',
        'overdue_invoices' => ':count Overdue Invoices',
        'fleet_utilization' => 'Fleet Utilization',
        'unit_in_use' => ':in_use / :total_active Units',
        'idle_ready' => ':count Idle / Ready',
        'compliance' => 'Compliance Alerts',
        'action_needed' => ':count Need Action',
        'document_expired' => ':count Documents Expired',
        'stnk_expiring' => ':count STNK Expired/Expiring',
        'maintenance_pending' => ':count Service Pending',
    ],

    'sections' => [
        'finance_invoice' => 'Financial & Invoice Performance',
        'revenue_per_line' => 'Revenue per Business Line',
        'invoice_status' => 'Invoice Status',
        'shuttle_ops' => 'Module: Travel & Shuttle (Today Operations)',
        'trip_status' => 'Departure Status',
        'occupancy' => 'Seat Occupancy',
        'upcoming_departures' => 'Upcoming Departures',
        'rental' => 'Module: Car Rental',
        'rental_status' => 'Unit Status',
        'logistics' => 'Module: Logistics & Courier',
        'logistics_status' => 'Shipment Status',
        'fleet_global' => 'Global Fleet & Driver Monitoring',
        'attention' => 'Need Attention & Quick Actions',
        'operational_alerts' => 'Operational Alerts',
        'quick_actions' => 'Quick Actions',
        'order_status' => 'Delivery order status',
        'alerts' => 'Alerts',
        'monthly_revenue' => 'Monthly revenue',
        'fleet' => 'Fleet',
        'top_partners' => 'Top partners (revenue)',
        'recent_activity' => 'Recent activity',
        'invoices' => 'Invoices',
        'content' => 'Content',
        'recent_content' => 'Recent content',
        'access_permissions' => 'Your access permissions',
    ],

    'subscription' => [
        'title' => 'Plan & Price per Vehicle',
        'subtitle' => 'PAYG pricing follows your fleet size automatically',
        'current_tier' => 'Active Tier',
        'per_vehicle' => '/vehicle',
        'monthly_estimate' => 'Monthly Estimate',
        'vehicles' => 'vehicles',
        'billed_quota_note' => 'Based on your subscribed quota',
        'projected_note' => 'Projected from your registered fleet',
        'your_tier' => 'Your Tier',
        'unlimited' => 'Unlimited',
        'no_tier' => 'No vehicles registered yet',
    ],

    'actions' => [
        'view_all' => 'View all',
        'manage' => 'Manage',
        'all_partners' => 'All partners',
        'manage_invoices' => 'Manage invoices',
    ],

    'finance' => [
        'line_rental' => 'Car Rental',
        'line_shuttle' => 'Travel / Shuttle',
        'line_logistics' => 'Logistics / Courier',
        'line_other' => 'Other',
    ],

    'invoice_status_summary' => [
        'draft' => 'Draft',
        'issued' => 'Issued',
        'paid' => 'Paid',
        'overdue' => 'Overdue',
    ],

    'shuttle' => [
        'total_trips_today' => 'Total Trips Today',
        'total_trips_unit' => 'Departures',
        'occupancy_label' => 'Seat Occupancy',
        'occupancy_detail' => ':booked / :total Seats',
        'seat_unit' => 'Seats',
    ],

    'rental_unit' => [
        'currently_rented' => 'Currently Rented',
        'idle_ready' => 'Idle (Ready to Rent)',
        'overdue' => 'Overdue Rental',
        'unit_vehicles' => 'Vehicles',
    ],

    'logistics_unit' => [
        'total_resi_today' => 'Total Shipments Today',
        'in_transit' => 'In Transit',
        'delivered_pod' => 'Delivered (POD)',
        'unit_shipments' => 'Shipments',
    ],

    'fleet_global' => [
        'active' => 'Active Fleet',
        'maintenance' => 'Under Maintenance',
        'drivers_ready' => 'Drivers Ready',
        'drivers_leave' => 'Drivers On Leave',
        'fuel_consumption' => 'Fuel Consumption',
        'unit_vehicles' => 'Vehicles',
        'unit_people' => 'People',
        'unit_liters' => 'Liters',
    ],

    'departure_status' => [
        'ready' => 'Ready to Go',
        'locked' => 'Locked',
        'optimized' => 'Optimized',
        'boarding' => 'Boarding',
        'in_transit' => 'In Transit',
    ],

    'alerts' => [
        'rental_overdue_title' => '[Rental] Unit Overdue',
        'rental_overdue_message' => 'Unit :plate — returned late (:hours hours ago)',
        'shuttle_no_driver_title' => '[Travel] No Driver Assigned',
        'shuttle_no_driver_message' => 'Trip :route (:time) — driver not assigned',
        'stnk_expiring_title' => '[Fleet] STNK Expiring Soon',
        'stnk_expiring_message' => 'STNK :plate expires in :days days',
        'maintenance_overdue_title' => '[Maintenance] Service Overdue',
        'invoice_overdue_title' => '[Invoice] Payment Overdue',
    ],

    'quick_actions' => [
        'new_rental_reservation' => '+ New Rental Reservation',
        'issue_travel_ticket' => '+ Issue Travel Ticket',
        'create_logistics_resi' => '+ Create Logistics Shipment',
        'create_manual_invoice' => '+ Create Manual Invoice',
    ],

    'fleet' => [
        'active_vehicles' => 'Active vehicles',
        'available_drivers' => 'Available drivers',
        'in_maintenance' => 'In maintenance',
        'unit_vehicles' => 'vehicles',
        'fuel_this_period' => 'Fuel this period',
        'unit_liters' => 'liters',
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
        'active' => 'Active',
        'maintenance' => 'Maintenance',
        'inactive' => 'Inactive',
    ],

    'invoice_status' => [
        'draft' => 'Draft',
        'issued' => 'Issued',
        'paid' => 'Paid',
        'overdue' => 'Overdue',
    ],

    'content_stats' => [
        'posts' => 'Posts',
        'pages' => 'Pages',
        'media' => 'Media',
        'carousels' => 'Carousels',
        'published_draft' => ':published published, :draft draft',
        'media_detail' => ':images images, :documents documents',
        'active_count' => ':count active',
    ],

    'content_tabs' => [
        'posts' => 'Posts',
        'pages' => 'Pages',
    ],

    'status_labels' => [
        'published' => 'Published',
        'draft' => 'Draft',
    ],

    'time' => [
        'just_now' => 'Just now',
        'minutes_ago' => ':count minutes ago',
        'hours_ago' => ':count hours ago',
        'days_ago' => ':count days ago',
    ],

    'activity' => [
        'do_delivered' => 'DO :code delivered',
        'do_in_transit' => 'DO :code in transit',
        'do_confirmed' => 'DO :code confirmed',
        'do_created' => 'DO :code created',
        'trip_completed' => 'Trip :code completed',
        'trip_started' => 'Trip :code started',
        'trip_scheduled' => 'Trip :code scheduled',
        'rental_completed' => 'Rental :code completed',
        'rental_active' => 'Rental :code active',
        'rental_confirmed' => 'Rental :code confirmed',
        'rental_created' => 'Rental :code created',
        'shuttle_completed' => 'Departure :code completed',
        'shuttle_in_transit' => 'Departure :code in transit',
        'shuttle_dispatched' => 'Departure :code dispatched',
        'shuttle_created' => 'Departure :code scheduled',
        'invoice_paid' => 'Invoice :code paid',
        'invoice_issued' => 'Invoice :code issued',
        'invoice_created' => 'Invoice :code created',
        'wo_completed' => 'Service completed',
        'wo_created' => 'WO :ref: :title',
    ],
];
