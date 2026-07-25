<?php

return [
    'title' => 'Posts',

    'status' => [
        'published' => 'Published',
        'draft' => 'Draft',
    ],

    'fields' => [
        'title' => 'Post Title',
        'slug' => 'URL Slug',
        'excerpt' => 'Excerpt',
        'content' => 'Content',
        'featured_image' => 'Featured Image URL',
        'published' => 'Published',
        'published_date' => 'Published Date',
    ],

    'placeholders' => [
        'title' => 'Enter post title',
        'slug' => 'post-url-slug',
        'excerpt' => 'Brief description of the post…',
        'content' => 'Write your post content here…',
        'featured_image' => 'https://example.com/image.jpg',
    ],

    'hints' => [
        'excerpt' => 'A short summary that appears in post listings.',
        'featured_image' => 'URL to the featured image for this post.',
        'slug_prefix' => '/blog/',
    ],

    'index' => [
        'head' => 'Posts',
        'create' => 'Create Post',
        'empty_title' => 'No posts yet',
        'empty_hint' => 'Get started by creating your first blog post.',
        'columns' => [
            'title' => 'Title',
            'slug' => 'Slug',
            'status' => 'Status',
            'published' => 'Published',
        ],
        'preview' => 'Preview',
        'delete_title' => 'Delete Post',
        'delete_confirm' => 'Are you sure you want to delete the post ":title"? This cannot be undone.',
        'delete_confirm_generic' => 'Are you sure you want to delete this post?',
    ],

    'create' => [
        'title' => 'Create New Post',
        'head' => 'Create Post',
        'publish_immediately' => 'Publish immediately',
        'creating' => 'Creating…',
        'submit' => 'Create Post',
    ],

    'edit' => [
        'head' => 'Edit Post',
        'title' => 'Edit: :title',
        'last_updated' => 'Last updated: :time',
        'published_on' => 'Published on: :date',
        'preview' => 'Preview',
        'saving' => 'Saving…',
        'submit' => 'Save Changes',
    ],

    'show' => [
        'head' => 'Preview Post',
        'title' => 'Preview: :title',
        'last_updated' => 'Last updated: :time',
        'edit_post' => 'Edit Post',
        'back' => 'Back to Posts',
        'empty_content' => 'No content yet.',
        'add_content' => 'Add content →',
    ],

    'validation' => [
        'title_required' => 'The post title is required.',
        'title_max' => 'The post title must not exceed 255 characters.',
        'slug_required' => 'The post slug is required.',
        'slug_unique' => 'This slug is already in use.',
        'excerpt_max' => 'The excerpt must not exceed 500 characters.',
    ],

    'messages' => [
        'updated' => 'Post updated successfully.',
        'deleted' => 'Post deleted successfully.',
    ],
];
