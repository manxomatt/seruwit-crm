<?php

return [
    'title' => 'Master Pools & Depots',
    'bases' => 'Pools & Depots',

    'nav' => [
        'list' => 'Master Pools & Depots',
    ],

    'status' => [
        'active' => 'Active',
        'inactive' => 'Inactive',
    ],

    'base_kinds' => [
        'depot' => 'Main Depot',
        'yard' => 'Parking Yard',
        'satellite' => 'Satellite Branch',
        'workshop_base' => 'Workshop Base',
    ],

    'messages' => [
        'base_created' => 'Fleet base / pool successfully created.',
        'base_updated' => 'Fleet base / pool successfully updated.',
        'base_deleted' => 'Fleet base / pool successfully deleted.',
        'base_in_use' => 'Fleet base still has assigned vehicles and cannot be deleted.',
        'base_last_remaining' => 'Cannot delete the base because it is the only remaining base.',
        'bases_status_updated' => ':count bases updated to :status.',
        'bases_batch_deleted' => ':count bases deleted.',
        'bases_batch_deleted_partial' => ':deleted bases deleted. :blocked could not be deleted because they have vehicles assigned or are the last remaining base.',
        'bases_batch_delete_blocked' => 'None of the selected bases could be deleted because they have vehicles or are the last remaining base.',
        'limit_reached_bases' => 'Tenant has reached the maximum limit of :limit fleet bases under the current subscription plan.',
        'base_create_forbidden_for_head' => 'Fleet Base Head is not authorized to create new bases.',
        'base_delete_forbidden_for_head' => 'Fleet Base Head is not authorized to delete bases.',
    ],

    'validation' => [
        'closes_after_opens' => 'Closing time must be after opening time.',
        'base_access_denied' => 'You do not have access to this fleet base.',
        'batch_ids_required' => 'Select at least one fleet base.',
        'limit_reached_bases' => 'Tenant has reached the maximum limit of :limit fleet bases under the current subscription plan.',
    ],
];
