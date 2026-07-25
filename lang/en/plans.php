<?php

return [
    'title' => 'Plans',

    'fields' => [
        'name' => 'Name',
        'key' => 'Key',
        'key_hint_locked' => "Key can't be changed — tenants store it as a reference to their plan.",
        'key_hint_new' => 'Lowercase letters, numbers, and hyphens. Permanent once created.',
        'description' => 'Description',
        'sort_order' => 'Display Order',
        'is_default' => 'Make this the default plan',
        'is_default_hint' => 'Used by tenants without a plan of their own. Only one plan can be default.',
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
            'default_badge' => 'Default',
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
            'no_modules_match' => 'No modules match “:query”.',
            'search_placeholder' => 'Search modules…',
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
