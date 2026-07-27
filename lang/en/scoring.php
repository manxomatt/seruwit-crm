<?php

return [
    'title' => 'Driver Scoring',

    'nav' => [
        'leaderboard' => 'Leaderboard',
        'events' => 'Events',
        'incentives' => 'Incentives',
        'settings' => 'Settings',
    ],

    'status' => [
        'pending' => 'Pending',
        'approved' => 'Approved',
        'paid' => 'Paid',
        'rejected' => 'Rejected',
        'inactive' => 'Inactive',
    ],

    'types' => [
        'harsh_brake' => 'Harsh brake',
        'harsh_accel' => 'Harsh accel',
        'speeding' => 'Speeding',
        'idle' => 'Idle',
        'weekly' => 'Weekly',
        'monthly' => 'Monthly',
    ],

    'fields' => [
        'name' => 'Name',
        'period' => 'Period',
        'min_avg_score' => 'Min avg score',
        'min_scored_days' => 'Min scored days',
        'reward_amount' => 'Reward amount',
        'reward_label' => 'Reward label',
        'driver' => 'Driver',
        'score' => 'Score',
        'type' => 'Type',
        'status' => 'Status',
        'date' => 'Date',
        'amount' => 'Amount',
    ],

    'placeholders' => [
        'all_drivers' => 'All drivers',
        'all_vehicles' => 'All vehicles',
        'all_types' => 'All types',
        'search_drivers' => 'Search drivers…',
    ],

    'actions' => [
        'save_settings' => 'Save settings',
        'create_rule' => 'Create rule',
        'evaluate_awards' => 'Evaluate period awards',
        'back' => 'Back',
    ],

    'pages' => [
        'leaderboard' => [
            'title' => 'Driver Leaderboard',
            'head' => 'Driver Scoring',
            'empty' => 'No scores in range.',
            'empty_hint' => 'No scores yet. Ensure in-progress trips and GPS polling are active.',
        ],
        'events' => [
            'title' => 'Driving Events',
            'empty' => 'No events yet.',
        ],
        'incentives' => [
            'title' => 'Incentives',
            'empty_rules' => 'No rules yet.',
            'empty_awards' => 'No awards yet.',
            'delete_rule_title' => 'Delete incentive rule',
            'delete_rule_confirm' => 'Delete rule ":name"? Related awards for this rule will also be removed. This cannot be undone.',
        ],
        'settings' => [
            'title' => 'Scoring Settings',
        ],
    ],

    'messages' => [
        'thresholds_updated' => 'Scoring thresholds updated.',
        'rule_created' => 'Incentive rule created.',
        'rule_updated' => 'Incentive rule updated.',
        'rule_deleted' => 'Incentive rule deleted.',
        'awards_created' => ':count new incentive award(s) created.',
        'award_status_updated' => 'Award status updated.',
    ],
];
