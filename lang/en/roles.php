<?php

return [
    'title' => 'Roles',

    'fields' => [
        'name' => 'Role Name',
        'description' => 'Description',
        'permissions' => 'Permissions',
        'slug' => 'Slug',
        'type' => 'Type',
    ],

    'placeholders' => [
        'search' => 'Search roles by name or description…',
        'name' => 'e.g., Editor, Moderator',
        'description' => 'Describe what this role can do…',
    ],

    'type' => [
        'system' => 'System',
        'custom' => 'Custom',
    ],

    'permissions_selected' => 'Selected: :count permission(s)',

    'pages' => [
        'index' => [
            'head' => 'Role Management',
            'new' => 'Add Role',
            'empty_title' => 'No roles found',
            'empty_hint' => 'Get started by creating a new role.',
            'columns' => [
                'role' => 'Role',
                'description' => 'Description',
                'users' => 'Users',
                'permissions' => 'Permissions',
                'type' => 'Type',
                'created' => 'Created',
            ],
            'users_count' => ':count users',
            'permissions_count' => ':count permissions',
        ],
        'create' => [
            'title' => 'Create Role',
            'head' => 'Create Role',
            'submit' => 'Create Role',
            'submitting' => 'Creating…',
        ],
        'edit' => [
            'title' => 'Edit Role: :name',
            'head' => 'Edit Role: :name',
            'submit' => 'Save Changes',
            'submitting' => 'Saving…',
            'system_notice_title' => 'System Role',
            'system_notice_body' => 'Name and description are locked for system roles. You can still add or adjust permissions beyond the defaults.',
        ],
        'show' => [
            'title' => 'Role: :name',
            'head' => 'Role Details: :name',
            'information' => 'Role Information',
            'name' => 'Name',
            'slug' => 'Slug',
            'users_count' => ':count user(s)',
            'description_empty' => 'No description provided',
            'created' => 'Created',
            'updated' => 'Last Updated',
            'permissions_title' => 'Permissions (:count)',
            'permissions_empty' => 'No permissions assigned to this role.',
            'users_title' => 'Users with this Role (:count)',
            'users_empty' => 'No users have been assigned this role.',
            'view_user' => 'View User',
        ],
    ],

    'actions' => [
        'view' => 'View',
        'select_all' => 'Select All',
        'clear_all' => 'Clear All',
        'edit_role' => 'Edit Role',
        'back_to_roles' => 'Back to Roles',
    ],

    'delete_confirm' => [
        'title' => 'Delete Role',
        'message' => 'Are you sure you want to delete the role ":name"? This action cannot be undone.',
        'message_generic' => 'Are you sure you want to delete this role?',
    ],

    'validation' => [
        'name_required' => 'The role name is required.',
        'name_max' => 'The role name must not exceed 255 characters.',
        'name_unique' => 'A role with this name already exists.',
        'description_max' => 'The description must not exceed 500 characters.',
        'permissions_array' => 'Permissions must be an array.',
        'permissions_exists' => 'One or more selected permissions are invalid.',
    ],

    'messages' => [
        'created' => 'Role created successfully.',
        'updated' => 'Role updated successfully.',
        'deleted' => 'Role deleted successfully.',
        'system_cannot_modify' => 'System role identity cannot be modified.',
        'system_cannot_delete' => 'System roles cannot be deleted.',
        'cannot_delete_assigned' => 'Cannot delete role with assigned users.',
    ],
];
