<?php

return [
    'title' => 'Plans',

    'stats' => [
        'available_plans' => 'Available Plans',
        'available_plans_hint' => 'Defined subscription tiers for tenants',
        'total_tenants' => 'Total Subscribed Tenants',
        'total_tenants_hint' => 'Active tenant subscriptions across plans',
        'default_fallback' => 'Default Plan Fallback',
        'default_fallback_hint' => 'Auto-assigned to unconfigured tenants',
        'none' => 'None',
    ],

    'header' => [
        'title' => 'SaaS Subscription Plans',
        'subtitle' => 'Manage prices, billing periods, and module allocations provided to each tenant.',
    ],

    'billing' => [
        'monthly' => 'Monthly',
        'annual' => 'Annual',
        'per_month' => '/ mo',
        'per_year' => '/ yr',
        'monthly_not_set' => 'Monthly price not set',
        'save_percent' => 'Save :percent%',
        'modules_covered' => 'Modules Covered (:count)',
        'no_modules_allocated' => 'No modules allocated yet',
        'tenants_enrolled' => ':count Subscribed Tenant(s)',
        'annual_savings_note' => 'Annual option provides a :percent% savings compared to paying monthly.',
    ],

    'tabs' => [
        'main_info' => '1. Main Info',
        'pricing' => '2. Pricing & Billing',
        'modules' => '3. Modules (:count)',
        'limits' => '4. Limits & Highlights',
    ],

    'fields' => [
        'name' => 'Plan Name',
        'name_placeholder' => 'e.g. Enterprise Plan',
        'key' => 'Key',
        'key_hint_locked' => "Key can't be changed — tenants store it as a reference to their plan.",
        'key_hint_new' => 'Lowercase letters, numbers, and hyphens. Permanent once created.',
        'description' => 'Description',
        'description_placeholder' => 'Provide a short overview of this plan...',
        'badge' => 'Marketing Badge',
        'badge_placeholder' => 'e.g. Most Popular, 20% Off',
        'is_popular' => 'Highlight as Featured / Popular Plan',
        'is_popular_hint' => 'Displays custom border accents, styling, and ribbons on the tenant subscription page.',
        'max_vehicles' => 'Max Fleet Vehicles',
        'max_vehicles_hint' => '0 or empty = Unlimited',
        'max_users' => 'Max User Accounts',
        'max_users_hint' => '0 or empty = Unlimited',
        'max_branches' => 'Max Branches / Locations',
        'max_branches_hint' => '0 or empty = Unlimited',
        'features_list' => 'Key Feature Highlights (Pricing Checklist)',
        'features_list_hint' => 'Bullet point text shown on subscription pricing cards.',
        'add_feature' => 'Add Feature Highlight',
        'feature_placeholder' => 'e.g. Automated Contracts & Invoicing',
        'sort_order' => 'Display Order',
        'trial_days' => 'Trial Length (days)',
        'trial_days_hint' => '0 = no trial; how long a tenant may use this plan before payment is required',
        'is_default' => 'Make this the default plan',
        'is_default_hint' => 'Used by tenants without a plan of their own. Only one plan can be default.',
    ],

    'form' => [
        'currency_title' => 'Pricing Structure & Currency',
        'monthly_section' => '1. Monthly Subscription',
        'monthly_normal' => 'Regular Monthly Price',
        'monthly_original' => 'Strikethrough Monthly Price',
        'annual_section' => '2. Annual Subscription',
        'annual_normal' => 'Annual Price',
        'annual_original' => 'Strikethrough Annual Price',
        'hint_paid' => 'price paid by tenant',
        'hint_original' => 'optional strikethrough',
        'hint_annual_paid' => 'total paid per year',
        'modules_allocation_title' => 'SaaS Module Allocation',
        'modules_allocation_subtitle' => 'Select modules that will automatically unlock for tenants on this plan.',
        'select_modules' => 'Select Included Modules',
        'modules_selected' => ':count Selected',
        'requires_modules' => 'Requires modules',
        'no_dependencies' => 'Standalone (No dependencies)',
    ],

    'preview' => [
        'live_preview' => 'Live Plan Preview',
        'name_placeholder' => 'Plan Name',
        'desc_placeholder' => 'Short description of the plan will appear here.',
        'no_modules' => 'No modules selected yet',
    ],

    'tiers' => [
        'vertical' => [
            'label' => 'Business Features',
            'hint' => 'Modules sold as headline features',
        ],
        'foundation' => [
            'label' => 'Foundation',
            'hint' => 'Data & services that underpin business features',
        ],
        'content' => [
            'label' => 'Content & Site',
            'hint' => 'Public pages and CMS',
        ],
    ],

    'pages' => [
        'index' => [
            'head' => 'Plans',
            'new' => 'Add Plan',
            'description' => 'Plans determine which modules a tenant may install. Changing a plan applies to every tenant on it on their next request, and never deletes data — narrowing a plan only locks modules.',
            'default_badge' => 'DEFAULT',
            'no_modules' => 'No additional modules',
            'module_disabled_title' => 'This module is disabled platform-wide',
            'tenant_count' => ':count tenant(s) on this plan',
            'default_suffix' => ' (including those without a plan of their own)',
            'delete_disabled_default' => "The default plan can't be deleted",
            'delete_disabled_in_use' => 'Still used by tenants',
            'modal_edit_title' => 'Edit plan :name',
            'modal_create_title' => 'New plan',
            'modules_section_title' => 'Modules in this plan',
            'modules_selected_count' => ':count selected',
            'no_modules_registered' => 'No optional modules registered yet.',
            'no_modules_match' => 'No modules match search',
            'search_placeholder' => 'Search module name or key…',
            'module_disabled_badge' => 'Disabled',
            'tenants_warning' => ':count tenant(s) use this plan. Removing a module will lock their access — their data stays intact and returns if the module is added back.',
            'delete_title' => 'Delete plan :name?',
            'delete_message' => "This plan isn't used by any tenant, so deleting it has no impact on running workspaces.",
        ],
    ],

    'actions' => [
        'select_all' => 'Select all',
        'clear_all' => 'Clear',
        'delete_confirm' => 'Delete plan',
        'saving' => 'Saving…',
        'back' => '← Back',
        'next' => 'Next →',
    ],

    'validation' => [
        'key_regex' => 'Key may only contain lowercase letters, numbers, and hyphens.',
        'key_unique' => 'This key is already used by another plan.',
        'modules_in' => 'That module is not registered.',
    ],

    'messages' => [
        'created' => 'Plan :name created.',
        'updated' => 'Plan :name updated. Changes apply to every tenant on this plan.',
        'deleted' => 'Plan :name deleted.',
        'delete_in_use' => 'Plan :name is still used by :count tenant(s). Move them first before deleting it.',
        'delete_default' => "The default plan can't be deleted. Set another plan as default first.",
    ],
];
