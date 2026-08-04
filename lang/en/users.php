<?php

return [
    'title' => 'Users',

    'fields' => [
        'name' => 'Name',
        'email' => 'Email',
        'password' => 'Password',
        'password_confirmation' => 'Confirm Password',
        'password_hint' => 'Password (leave blank to keep current)',
        'roles' => 'Roles',
        'warehouses' => 'Assigned sites',
        'fleet_bases' => 'Assigned fleet bases',
        'first_name' => 'First Name',
        'last_name' => 'Last Name',
        'phone_number' => 'Phone Number',
        'avatar_url' => 'Avatar URL',
    ],

    'placeholders' => [
        'search' => 'Search users by name or email…',
        'avatar_url' => 'https://example.com/avatar.jpg',
    ],

    'sections' => [
        'profile_information' => 'Profile Information',
        'account_details' => 'Account Details',
    ],

    'roles_selected' => 'Selected: :count role(s)',
    'warehouses_selected' => 'Selected: :count site(s)',
    'warehouses_hint_head' => 'Warehouse Head must be assigned to exactly one site.',
    'warehouses_hint_manager' => 'Warehouse Manager can be assigned to one or more sites.',
    'fleet_bases_selected' => 'Selected: :count fleet base(s)',
    'fleet_bases_hint_head' => 'Fleet Base Head must be assigned to exactly one base.',
    'fleet_bases_hint_manager' => 'Fleet Base Manager can be assigned to one or more bases.',
    'system_badge' => 'System',

    'pages' => [
        'index' => [
            'head' => 'User Management',
            'new' => 'Add User',
            'empty_title' => 'No users found',
            'empty_hint' => 'Get started by creating a new user.',
            'columns' => [
                'user' => 'User',
                'email' => 'Email',
                'roles' => 'Roles',
                'status' => 'Status',
                'created' => 'Created',
            ],
            'no_roles' => 'No roles',
            'verified' => 'Verified',
            'unverified' => 'Unverified',
        ],
        'create' => [
            'title' => 'Create User',
            'head' => 'Create User',
            'submit' => 'Create User',
        ],
        'edit' => [
            'title' => 'Edit User - :name',
            'head' => 'Edit User',
            'submit' => 'Update User',
        ],
        'show' => [
            'title' => 'User - :name',
            'head' => 'User Details',
            'user_id' => 'User ID',
            'username' => 'Username',
            'email_address' => 'Email Address',
            'email_verified' => 'Email Verified',
            'email_not_verified' => 'Email Not Verified',
            'email_verified_at' => 'Email Verified At',
            'not_verified' => 'Not verified',
            'created_at' => 'Created At',
            'updated_at' => 'Last Updated',
            'back' => 'Back to Users',
        ],
    ],

    'actions' => [
        'view' => 'View',
        'edit_user' => 'Edit User',
        'delete_user' => 'Delete User',
    ],

    'delete_confirm' => [
        'title' => 'Delete User',
        'message' => 'Are you sure you want to delete user ":name" (:email)? All related data will also be deleted. This cannot be undone.',
        'message_generic' => 'Are you sure you want to delete this user?',
    ],

    'validation' => [
        'name_required' => 'The user name is required.',
        'name_max' => 'The user name must not exceed 255 characters.',
        'email_required' => 'The email address is required.',
        'email_valid' => 'Please enter a valid email address.',
        'email_unique' => 'This email address is already in use.',
        'password_required' => 'The password is required.',
        'password_confirmed' => 'The password confirmation does not match.',
        'roles_array' => 'Roles must be an array.',
        'roles_exists' => 'One or more selected roles are invalid.',
        'warehouse_ids_required' => 'Assign at least one warehouse or store site for this role.',
        'warehouse_head_single_site' => 'A Warehouse Head can only be assigned to one site.',
        'fleet_base_ids_required' => 'Assign at least one fleet base for this role.',
        'fleet_base_head_single_base' => 'A Fleet Base Head can only be assigned to one base.',
    ],

    'messages' => [
        'created' => 'User created successfully.',
        'updated' => 'User updated successfully.',
        'deleted' => 'User deleted successfully.',
        'invitation_sent' => 'Invitation sent to :email.',
        'already_member' => 'This user is already a member of the workspace.',
    ],
];
