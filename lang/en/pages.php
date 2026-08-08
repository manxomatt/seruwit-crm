<?php

return [
    'title' => 'Pages',

    'status' => [
        'published' => 'Published',
        'draft' => 'Draft',
    ],

    'index' => [
        'head' => 'Pages',
        'create' => 'Create Page',
        'empty_title' => 'No pages yet',
        'empty_hint' => 'Get started by creating your first page.',
        'columns' => [
            'title' => 'Title',
            'slug' => 'Slug',
            'status' => 'Status',
            'updated' => 'Updated',
        ],
        'homepage' => 'Homepage',
        'preview' => 'Preview',
        'copy' => 'Copy Page',
        'rename' => 'Rename',
        'set_homepage' => 'Set as Homepage',
        'set_homepage_confirm' => 'Set this page as the homepage? This will replace the current homepage.',
        'delete_title' => 'Delete Page',
        'delete_confirm' => 'Are you sure you want to delete the page ":title"? This cannot be undone.',
        'delete_confirm_generic' => 'Are you sure you want to delete this page?',
    ],

    'rename' => [
        'title' => 'Rename Page',
        'page_title' => 'Page Title',
        'slug' => 'URL Slug',
        'slug_hint' => 'The URL path for this page.',
        'submit' => 'Save Changes',
    ],

    'create' => [
        'title' => 'Create New Page',
        'head' => 'Create Page',
        'page_title' => 'Page Title',
        'title_placeholder' => 'Enter page title',
        'slug' => 'URL Slug',
        'slug_placeholder' => 'page-url-slug',
        'slug_hint' => 'This will be the URL path for your page.',
        'creating' => 'Creating…',
        'submit' => 'Create & Open Editor',
    ],

    'show' => [
        'preview_title' => 'Preview: :title',
        'preview_hint' => 'View how your page will appear to visitors',
        'edit_page' => 'Edit Page',
        'url' => 'URL:',
        'view_live' => 'View Live Page',
        'empty_title' => 'No content yet',
        'empty_hint' => "This page doesn't have any content. Open the editor to start building.",
        'open_editor' => 'Open Editor',
    ],

    'editor' => [
        'title' => 'Edit: :title',
        'back' => 'Back to Pages',
        'last_saved' => 'Last saved: :time',
        'saving' => 'Saving…',
        'save' => 'Save',
        'publish' => 'Publish',
        'unpublish' => 'Unpublish',
        'preview' => 'Preview',
    ],

    'messages' => [
        'updated' => 'Page updated successfully.',
        'deleted' => 'Page deleted successfully.',
        'homepage_set' => 'Homepage set successfully.',
        'copied' => 'Page copied successfully.',
    ],
];
