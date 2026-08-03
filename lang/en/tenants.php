<?php

return [
    'title' => 'Tenants',

    'fields' => [
        'company_name' => 'Company Name',
        'subdomain' => 'Subdomain',
        'owner_name' => 'Owner Name',
        'owner_email' => 'Owner Email',
        'owner_password' => 'Owner Password',
        'owner_password_hint' => '(leave blank if the account already exists)',
        'name' => 'Name',
        'domain' => 'Domain',
        'members' => 'Members',
        'status' => 'Status',
        'created_at' => 'Created',
        'plan' => 'Subscription Plan',
        'plan_hint' => 'Downgrading only revokes access — modules already installed and their data stay intact and return the moment the plan is upgraded again.',
        'can_install_demo_data' => 'Allow demo data install',
        'can_install_demo_data_hint' => 'When enabled, this workspace can install and remove sample datasets from Modules.',
        'billing_email' => 'Billing Email',
        'phone' => 'Phone',
        'tax_id' => 'Tax ID (NPWP)',
        'address' => 'Address',
        'notes' => 'Internal Notes',
        'notes_hint' => '(only visible to platform admins)',
        'confirm_name' => 'Type :name to confirm',
    ],

    'status' => [
        'active' => 'Active',
        'suspended' => 'Suspended',
    ],

    'pages' => [
        'index' => [
            'head' => 'Tenants',
            'new' => 'Create Tenant',
            'close_form' => 'Close Form',
            'create_heading' => 'Create New Tenant',
            'submit' => 'Create Tenant',
            'empty_title' => 'No tenants yet',
            'empty_hint' => 'Get started by creating your first customer workspace.',
            'columns' => [
                'name' => 'Name',
                'domain' => 'Domain',
                'members' => 'Members',
                'status' => 'Status',
                'created_at' => 'Created',
                'actions' => 'Actions',
            ],
        ],

        'show' => [
            'head_title' => 'Tenant: :name',
            'members_heading' => 'Members',
            'member_columns' => [
                'name' => 'Name',
                'email' => 'Email',
                'roles' => 'Roles',
            ],
            'no_members' => 'No members yet.',
            'edit_heading' => 'Edit Details',
            'subdomain_warning' => "Changing the subdomain will change this workspace's URL — old links will stop working.",
            'profile_heading' => 'Profile & Contact',
            'modules_heading' => 'Modules',
            'modules_hint' => 'What may be installed is determined by the plan above. Uninstalling a module does not delete its data — data is kept for :days days before permanent deletion.',
            'no_modules' => 'No optional modules registered yet.',
            'module_states' => [
                'installed' => 'Installed',
                'available' => 'Available',
                'uninstalled' => 'Uninstalled',
                'locked' => 'Outside plan',
                'locked_with_data' => 'Locked, data retained',
                'disabled' => 'Disabled',
                'disabled_with_data' => 'Disabled',
            ],
            'purges_at' => 'Data permanently deleted on :date.',
            'module_disabled_hint' => 'This module is disabled platform-wide for all tenants.',
            'module_disabled_with_data_hint' => 'This module is disabled platform-wide for all tenants — its data remains stored.',
            'plans_offering_hint' => "Available on the :plans plan(s) — move this tenant's plan to unlock.",
            'danger_zone' => 'Danger Zone',
            'danger_zone_hint' => 'Deleting a tenant will permanently delete all of its data (database schema, users, content). This action cannot be undone.',
        ],
    ],

    'actions' => [
        'suspend' => 'Suspend',
        'activate' => 'Activate',
        'view_detail' => 'Detail',
        'install' => 'Install',
        'uninstall' => 'Uninstall',
        'save_changes' => 'Save Changes',
        'delete_permanently' => 'Permanently Delete Tenant',
    ],

    'validation' => [
        'subdomain_format' => 'Subdomain may only contain lowercase letters, numbers, and hyphens (3–30 characters).',
        'subdomain_reserved' => 'This subdomain is not available.',
        'subdomain_taken' => 'This subdomain is already in use.',
    ],

    'messages' => [
        'created' => 'Tenant created successfully.',
        'updated' => 'Tenant details updated.',
        'status_updated' => 'Tenant status updated.',
        'deleted' => 'Tenant and all its data have been deleted.',
        'confirm_name_mismatch' => 'The confirmation name does not match the tenant name.',
        'module_installed' => 'Module :module installed for :tenant.',
        'module_uninstalled' => 'Module :module uninstalled from :tenant. Its data is retained for :days days.',
    ],
];
