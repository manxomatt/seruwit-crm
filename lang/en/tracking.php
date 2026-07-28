<?php

return [
    'title' => 'Tracking',

    'nav' => [
        'map' => 'Live Map',
        'devices' => 'Devices',
        'settings' => 'Settings',
    ],

    'status' => [
        'online' => 'Online',
        'unknown' => 'Unknown',
        'unpaired' => 'Not paired',
    ],

    'auth_types' => [
        'basic' => 'Email & password',
        'token' => 'API token',
    ],

    'fields' => [
        'base_url' => 'Traccar server URL',
        'auth_type' => 'Authentication',
        'token' => 'API token',
        'email' => 'Traccar user',
        'password' => 'Password',
        'geofence_radius_m' => 'Arrival radius (m)',
        'retain_positions_days' => 'Keep raw positions (days)',
        'trail_every_m' => 'Trail point every (m)',
        'trail_every_minutes' => '…or every (minutes)',
        'vehicle' => 'Vehicle',
        'device' => 'Device',
        'status' => 'Status',
    ],

    'placeholders' => [
        'select_vehicle' => 'Select a vehicle',
    ],

    'actions' => [
        'sync' => 'Sync from Traccar',
        'pair' => 'Pair',
        'unpair' => 'Unpair',
        'save' => 'Save Settings',
        'test_connection' => 'Test connection',
        'pause_live' => 'Pause live',
        'resume_live' => 'Resume live',
    ],

    'pages' => [
        'map' => [
            'title' => 'Live Map',
            'polling_off' => 'Polling is switched off. Positions will not update automatically.',
            'last_poll_failed' => 'Last poll failed: :error',
        ],
        'devices' => [
            'title' => 'GPS Devices',
            'empty' => 'No devices yet.',
            'empty_search' => 'No devices match your search.',
            'search' => 'Search by device, IMEI, or paired vehicle…',
            'all_paired' => 'Every vehicle already has a tracker.',
        ],
        'settings' => [
            'title' => 'Tracking Settings',
        ],
    ],

    'messages' => [
        'settings_saved' => 'Tracking settings saved.',
        'fill_credentials' => 'Fill in the server URL and credentials first.',
        'connection_ok' => 'Connected to Traccar successfully.',
        'configure_first' => 'Configure the Traccar connection first.',
        'synced' => 'Synced :count device(s) from Traccar.',
        'already_paired' => 'This device is already paired. Unpair it first.',
        'vehicle_has_tracker' => 'That vehicle already has a tracker.',
        'paired' => 'Paired to :vehicle.',
        'unpaired' => 'Device unpaired.',
        'unpair_before_delete' => 'Unpair the device from its vehicle before deleting it.',
        'deleted' => 'Device deleted.',
    ],
];
