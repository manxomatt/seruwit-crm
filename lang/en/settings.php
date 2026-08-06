<?php

return [
    'title' => 'Settings',

    'fields' => [
        'key' => 'Key',
        'label' => 'Label',
        'group' => 'Group',
        'type' => 'Type',
        'value' => 'Value',
        'description' => 'Description (optional)',
        'sort_order' => 'Sort Order',
        'is_public' => 'Make this setting publicly accessible',
    ],

    'placeholders' => [
        'key' => 'e.g., site.name or email.smtp_host',
        'key_hint' => 'Only lowercase letters, numbers, underscores, and dots allowed.',
        'label' => 'e.g., Site Name',
        'group' => 'e.g., shipping',
        'group_hint' => 'Only lowercase letters, numbers, and underscores allowed. This becomes a new tab in Settings.',
        'description' => 'Brief description of what this setting does…',
        'color' => '#000000',
    ],

    'groups' => [
        'general' => 'General',
        'site' => 'Site',
        'email' => 'Email',
        'social' => 'Social',
        'seo' => 'SEO',
        'maintenance' => 'Maintenance',
    ],

    'types' => [
        'text' => 'Text',
        'textarea' => 'Textarea',
        'boolean' => 'Boolean',
        'number' => 'Number',
        'email' => 'Email',
        'url' => 'URL',
        'select' => 'Select',
        'json' => 'JSON',
        'color' => 'Color',
    ],

    'boolean_options' => [
        'true' => 'Yes / True',
        'false' => 'No / False',
        'select_placeholder' => 'Select…',
    ],

    'pages' => [
        'index' => [
            'head' => 'Settings',
        ],
        'group' => [
            'title' => 'Settings — :group',
            'new_group' => '+ New Group',
            'add_setting' => 'Add Setting',
            'empty_title' => 'No settings in this group yet',
            'empty_hint' => 'Add one to get started.',
            'save' => 'Save Changes',
            'reset_appearance' => 'Reset to Default',
            'enabled_label' => 'Enabled',
        ],
        'create' => [
            'title' => 'Create Setting',
            'head' => 'Create Setting',
            'submit' => 'Create Setting',
            'choose_existing_group' => 'Choose an existing group instead',
            'create_new_group' => '+ Create a new group',
        ],
        'edit' => [
            'title' => 'Edit Setting - :label',
            'head' => 'Edit Setting',
            'submit' => 'Update Setting',
        ],
    ],

    'value_display' => [
        'yes' => 'Yes',
        'no' => 'No',
        'empty' => '—',
    ],

    'delete_confirm' => [
        'title' => 'Delete Setting',
        'message' => 'Are you sure you want to delete ":label" (key: :key)? This action cannot be undone.',
        'message_generic' => 'Are you sure you want to delete this setting?',
    ],

    'reset_appearance_confirm' => [
        'title' => 'Reset Appearance',
        'message' => 'Reset all Appearance settings to their system defaults? Custom colors, font, dark mode, CSS, and JavaScript will be cleared.',
    ],

    'validation' => [
        'key_required' => 'The setting key is required.',
        'key_unique' => 'This setting key already exists.',
        'key_regex' => 'The setting key may only contain lowercase letters, numbers, underscores, and dots.',
        'group_required' => 'The setting group is required.',
        'group_regex' => 'The group may only contain lowercase letters, numbers, and underscores.',
        'type_required' => 'The setting type is required.',
        'type_in' => 'The setting type must be one of: text, textarea, boolean, number, email, url, select, json, color.',
        'label_required' => 'The setting label is required.',
    ],

    'messages' => [
        'created' => 'Setting created successfully.',
        'updated' => 'Setting updated successfully.',
        'deleted' => 'Setting deleted successfully.',
        'bulk_updated' => 'Settings updated successfully.',
        'appearance_reset' => 'Appearance settings restored to defaults.',
    ],

    'mail' => [
        'title' => 'SMTP Server',
        'subtitle' => 'Use your own SMTP account for transactional emails from this workspace. When disabled or incomplete, the platform default mailer is used.',
        'status_active' => 'Tenant SMTP is active — outgoing mail uses these credentials.',
        'status_inactive' => 'Tenant SMTP is not active — outgoing mail uses the platform default mailer.',
        'enabled' => 'Use custom SMTP for this workspace',
        'host' => 'SMTP Host',
        'port' => 'Port',
        'encryption' => 'Encryption',
        'encryption_tls' => 'TLS',
        'encryption_ssl' => 'SSL',
        'encryption_none' => 'None',
        'username' => 'Username',
        'password' => 'Password',
        'password_hint' => 'Leave blank to keep the current password.',
        'save' => 'Save SMTP Settings',
        'messages' => [
            'saved' => 'SMTP settings saved successfully.',
        ],
        'validation' => [
            'host_required' => 'SMTP host is required when custom SMTP is enabled.',
            'port_required' => 'SMTP port is required when custom SMTP is enabled.',
            'username_required' => 'SMTP username is required when custom SMTP is enabled.',
            'password_required' => 'SMTP password is required when custom SMTP is enabled for the first time.',
        ],
    ],
];
