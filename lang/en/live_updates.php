<?php

return [
    'title' => 'Live Updates',

    'types' => [
        'info' => 'Info',
        'success' => 'Success',
        'warning' => 'Warning',
        'error' => 'Error',
    ],

    'fields' => [
        'title' => 'Title',
        'type' => 'Type',
        'content' => 'Content',
        'published_at' => 'Publish Date',
        'is_active' => 'Active',
        'create_heading' => 'Create New Update',
        'recent_updates' => 'Recent Updates',
        'server_time' => 'Server time',
        'not_published' => 'Not published',
        'published' => 'Published',
        'title_placeholder' => 'Update title',
        'content_placeholder' => 'Update content...',
        'about_title' => 'About Live Updates',
        'about_description' => 'This page uses Inertia.js v2 polling to automatically refresh data every 3 seconds. The polling indicator shows when the page is actively fetching new data. You can pause/resume polling using the button in the header.',
    ],

    'actions' => [
        'add' => 'Create Update',
        'delete' => 'Delete',
        'pause' => 'Paused',
        'resume' => 'Live',
    ],

    'delete_confirm' => 'Are you sure you want to delete this update?',

    'empty' => [
        'title' => 'No updates',
        'hint' => 'Get started by creating a new update above.',
    ],

    'polling_label' => 'Auto-refresh',

    'last_updated' => 'Last updated',

    'messages' => [
        'created' => 'Live update created successfully.',
        'updated' => 'Live update updated successfully.',
        'deleted' => 'Live update deleted successfully.',
    ],
];
