<?php

return [
    'title' => 'Trade Promotions',

    'nav' => [
        'programs' => 'Programs',
        'realizations' => 'Realizations',
    ],

    'status' => [
        'all' => 'All statuses',
        'draft' => 'Draft',
        'active' => 'Active',
        'paused' => 'Paused',
        'closed' => 'Closed',
        'open' => 'Open',
        'achieved' => 'Achieved',
        'accrued' => 'Accrued',
        'settled' => 'Settled',
    ],

    'placeholders' => [
        'all_types' => 'All types',
    ],

    'types' => [
        'volume_discount' => 'Volume discount',
        'free_goods' => 'Free goods',
        'rebate' => 'Rebate / rabat',
    ],

    'metrics' => [
        'volume' => 'Volume (qty)',
        'value' => 'Value (Rp)',
    ],

    'calc_basis' => [
        'qty' => 'Per unit qty',
        'net_value' => '% of value',
    ],

    'fields' => [
        'code' => 'Code',
        'name' => 'Name',
        'type' => 'Type',
        'period' => 'Period',
        'target' => 'Target',
        'status' => 'Status',
        'description' => 'Description',
        'principal' => 'Principal',
        'principal_optional' => 'Principal (optional)',
        'starts_at' => 'Starts at',
        'ends_at' => 'Ends at',
        'target_metric' => 'Target metric',
        'target_amount' => 'Target amount',
        'notes' => 'Notes',
        'min_qty' => 'Min qty',
        'discount_percent' => 'Discount %',
        'free_product' => 'Free product',
        'free_qty' => 'Free qty',
        'rebate_percent' => 'Rebate %',
        'rebate_per_unit' => 'Rebate per unit',
        'calc_basis' => 'Calc basis',
        'distributor' => 'Distributor',
        'qty' => 'Qty',
        'value' => 'Value',
        'achievement' => 'Achievement',
        'awards' => 'Awards',
        'program' => 'Program',
    ],

    'programs' => [
        'index' => [
            'title' => 'Trade Promotions',
            'new' => 'New Program',
            'subtitle' => 'Distributor promo programs: volume discount, free goods, rebate — active period & realization vs target.',
            'empty' => 'No promo programs yet.',
            'realizations_abbr' => ':count real.',
        ],
        'create' => [
            'title' => 'New Promo Program',
            'eligible_distributors' => 'Eligible distributors (empty = all customers)',
            'eligible_products' => 'Eligible products (empty = all)',
            'tiers' => 'Tiers',
            'add_tier' => 'Add tier',
            'submit' => 'Create program',
        ],
        'edit' => [
            'title' => 'Edit Program',
            'hint' => 'Type: :type. Distributors selected: :partners. Products: :products. Use Create for full tier editing on new programs; here you can adjust period and target.',
            'all' => 'all',
            'submit' => 'Save',
        ],
        'show' => [
            'activate' => 'Activate',
            'sync' => 'Sync realization',
            'close' => 'Close',
            'distributors' => 'Distributors',
            'all_customers' => 'All customers',
            'products' => 'Products',
            'all_products' => 'All products',
            'tiers' => 'Tiers',
            'min_qty' => 'Min qty :qty',
            'discount_off' => ':percent% off',
            'free_goods' => 'free :qty :product',
            'rebate_rule' => 'Rebate rule',
            'rebate_basis' => '· basis :basis',
            'realization_title' => 'Realization vs target',
            'empty_realization' => 'No realizations yet. Click Sync after delivery orders exist in the period.',
            'settle' => 'Settle',
        ],
    ],

    'realizations' => [
        'index' => [
            'title' => 'Promo Realizations',
            'all_programs' => 'All programs',
            'empty' => 'No realizations yet.',
        ],
    ],

    'messages' => [
        'program_created' => 'Program :code created.',
        'program_updated' => 'Program updated.',
        'program_activated' => 'Program activated.',
        'program_closed' => 'Program closed.',
        'program_deleted' => 'Program deleted.',
        'closed_cannot_edit' => 'Closed programs cannot be edited.',
        'deactivate_before_delete' => 'Deactivate or close the program before deleting.',
        'award_settled' => 'Award settled.',
        'award_already_settled' => 'Award already settled.',
        'synced' => 'Synced :count distributor realization(s).',
    ],
];
