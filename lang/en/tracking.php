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

    'providers' => [
        'traccar' => 'Traccar (generic)',
        'sky_track' => 'Sky Track (custom)',
    ],

    'auth_types' => [
        'basic' => 'Email & password',
        'token' => 'API token',
        'api_key' => 'API key (X-Api-Key)',
    ],

    'fields' => [
        'provider' => 'GPS provider',
        'base_url' => 'Traccar server URL',
        'sky_track_url' => 'Sky Track API URL',
        'auth_type' => 'Authentication',
        'token' => 'API token',
        'api_key' => 'API key',
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
            'empty_hint' => 'Use Sync to import trackers from your GPS provider.',
            'search' => 'Search by device, IMEI, or paired vehicle…',
            'all_paired' => 'Every vehicle already has a tracker.',
        ],
        'settings' => [
            'title' => 'Tracking Settings',
            'traccar_hint' => 'Generic Traccar-compatible server. Authenticate with email/password or an API token.',
            'sky_track_hint' => 'Custom Sky Track integration. Authenticate with an X-Api-Key header.',
            'api_key_hint' => 'Sent as the X-Api-Key request header. Leave blank to keep the stored key.',
        ],
    ],

    'messages' => [
        'settings_saved' => 'Tracking settings saved.',
        'fill_credentials' => 'Fill in the server URL and credentials first.',
        'connection_ok' => 'Connected to the GPS provider successfully.',
        'configure_first' => 'Configure the GPS provider connection first.',
        'synced' => 'Synced :count device(s) from the GPS provider.',
        'already_paired' => 'This device is already paired. Unpair it first.',
        'vehicle_has_tracker' => 'That vehicle already has a tracker.',
        'paired' => 'Paired to :vehicle.',
        'unpaired' => 'Device unpaired.',
        'unpair_before_delete' => 'Unpair the device from its vehicle before deleting it.',
        'deleted' => 'Device deleted.',
    ],
];
