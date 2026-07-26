<?php

return [
    'title' => 'Route Optimization',

    'status' => [
        'all' => 'all',
        'draft' => 'draft',
        'optimized' => 'optimized',
        'applied' => 'applied',
        'cancelled' => 'cancelled',
    ],

    'objective' => [
        'fuel_cost' => 'Minimise fuel cost',
        'distance' => 'Minimise distance',
    ],

    'fields' => [
        'code' => 'Code',
        'date' => 'Date',
        'plan_date' => 'Plan date',
        'objective' => 'Objective',
        'distance' => 'Distance',
        'cost' => 'Cost',
        'status' => 'Status',
        'depot_address' => 'Depot address',
        'depot_lat' => 'Depot latitude',
        'depot_lng' => 'Depot longitude',
        'vehicle' => 'Vehicle',
        'driver' => 'Driver',
        'total_distance' => 'Total distance',
        'estimated_cost' => 'Estimated cost',
        'routes' => 'Routes',
        'unassigned' => 'Unassigned',
        'geocoded_dos' => 'Geocoded DOs',
        'missing_coords' => 'Missing coords',
        'active_vehicles' => 'Active vehicles',
        'available_drivers' => 'Available drivers',
    ],

    'actions' => [
        'new_plan' => 'New Plan',
        'optimize_routes' => 'Optimize routes',
        're_optimize' => 'Re-optimize',
        'apply_create_trips' => 'Apply → create trips',
        'cancel_plan' => 'Cancel plan',
        'back' => 'Back',
    ],

    'pages' => [
        'index' => [
            'title' => 'Route Plans',
            'head' => 'Route Optimization',
            'intro' => 'VRP engine — assign drivers and vehicles automatically to minimise distance and fuel cost.',
            'empty' => 'No route plans yet.',
            'unassigned' => ':count unassigned',
        ],
        'create' => [
            'title' => 'New Route Plan',
            'orders_section' => 'Confirmed delivery orders',
            'orders_hint' => 'Only orders with delivery coordinates are optimizable. Add lat/lng on the order form.',
            'orders_empty' => 'No confirmed orders on this date.',
            'missing_coordinates' => 'Missing coordinates',
        ],
        'show' => [
            'depot' => 'Depot: :address (:lat, :lng)',
            'routes_empty' => 'No routes produced. Check vehicle capacity, driver availability, and order coordinates.',
            'route_heading' => 'Route #:sequence',
            'route_meta' => ':distance km · cost :cost · load :load kg',
            'route_trip' => ' · trip #:id',
            'stop_fallback' => 'Stop',
            'stop_meta' => '+:distance km · :demand kg · :lat, :lng',
            'map_title' => 'Route map',
            'map_depot' => 'Depot',
            'map_route_legend' => 'Route #:sequence · :vehicle',
            'map_stop_popup' => 'Route #:sequence · stop #:stop',
        ],
    ],

    'defaults' => [
        'depot_address' => 'Depot',
    ],

    'messages' => [
        'plan_optimized' => 'Plan :code optimized.',
        'plan_re_optimized' => 'Plan re-optimized.',
        'trips_created' => 'Trips created and delivery orders assigned.',
        'plan_cancelled' => 'Plan cancelled.',
        'route_assignment_updated' => 'Route assignment updated.',
        'directions_failed' => 'Could not resolve a road route for these stops.',
        'directions_need_points' => 'At least two coordinates are required to draw a route.',
    ],

    'errors' => [
        'cannot_reoptimize' => 'Cannot re-optimize an applied or cancelled plan.',
        'applied_cannot_cancel' => 'An applied plan cannot be cancelled.',
        'only_optimized_editable' => 'Only optimized plans can be edited.',
        'only_optimized_applicable' => 'Only an optimized plan can be applied.',
        'no_routes_to_apply' => 'Plan has no routes to apply.',
        'route_needs_vehicle_driver' => 'Every route needs a vehicle and driver before apply.',
        'order_not_confirmed' => 'Order :code is no longer confirmed.',
    ],

    'validation' => [
        'depot_lat_required' => 'Depot latitude is required for routing.',
        'depot_lng_required' => 'Depot longitude is required for routing.',
        'objective_in' => 'Choose distance or fuel cost as the objective.',
    ],
];
