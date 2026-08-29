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
            'title' => 'Driver Leaderboard & Safety Performance',
            'subtitle' => 'Monitor driver safety rankings and scores based on Traccar GPS telemetry data.',
            'head' => 'Driver Scoring & Leaderboard',
            'empty' => 'No scoring data found for this date range.',
            'empty_hint' => 'Ensure in-progress trips and Traccar GPS telemetry polling are active.',
            'fleet_avg_score' => 'Fleet Average Score',
            'top_performer' => 'Top Performer (MVP)',
            'total_incidents' => 'Total Incidents',
            'monitored_drivers' => 'Monitored Drivers',
            'podium_title' => 'Top 3 Performers',
            'rank' => 'Rank',
            'safety_score' => 'Safety Score',
            'active_days' => 'Active Days',
            'incident_breakdown' => 'Incident Breakdown',
            'view_analysis' => 'View Analytics',
            'period_presets' => [
                'this_week' => 'This Week',
                'this_month' => 'This Month',
                'last_30_days' => 'Last 30 Days',
            ],
            'filter_from' => 'From Date',
            'filter_to' => 'To Date',
            'search_placeholder' => 'Search driver name…',
            'score_rating' => [
                'excellent' => 'Excellent',
                'good' => 'Good',
                'fair' => 'Fair',
                'poor' => 'Needs Attention',
            ],
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
