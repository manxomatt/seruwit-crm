<?php

return [
    'title' => 'Media',

    'fields' => [
        'alt_text' => 'Alt Text',
        'description' => 'Description',
    ],

    'video_not_supported' => 'Your browser does not support the video tag.',

    'placeholders' => [
        'search' => 'Search media…',
        'alt_text' => 'Describe the image for accessibility',
        'alt_text_hint' => 'Alternative text is used by screen readers and displayed when the image cannot be loaded.',
        'description' => 'Add a description for this media file',
        'description_hint' => 'Optional description for internal reference.',
    ],

    'uploader' => [
        'choose' => 'Click or drop a file to upload',
        'hint' => 'Images or PDF, max 50MB',
        'uploading' => 'Uploading… :percent%',
        'remove' => 'Remove',
        'error_upload' => 'Failed to upload the file. Please try again.',
    ],

    'type' => [
        'image' => 'Image',
        'video' => 'Video',
        'document' => 'Document',
        'all' => 'All Types',
        'images' => 'Images',
        'videos' => 'Videos',
        'documents' => 'Documents',
    ],

    'stats' => [
        'total_files' => 'Total Files',
        'images' => 'Images',
        'videos' => 'Videos',
        'documents' => 'Documents',
    ],

    'pages' => [
        'index' => [
            'head' => 'Media Library',
            'upload' => 'Upload Media',
            'empty_title' => 'No media files',
            'empty_hint' => 'Get started by uploading your first media file.',
            'select_all' => 'Select all',
            'selected_count' => ':count item(s) selected',
            'delete_selected' => 'Delete Selected',
            'clear_selection' => 'Clear selection',
            'grid_view' => 'Grid View',
            'list_view' => 'List View',
            'columns' => [
                'select' => 'Select',
                'preview' => 'Preview',
                'name' => 'Name',
                'type' => 'Type',
                'size' => 'Size',
                'uploaded' => 'Uploaded',
            ],
        ],
        'create' => [
            'title' => 'Upload Media',
            'head' => 'Upload Media',
            'dropzone_hint' => 'Drag and drop files here, or',
            'browse' => 'browse',
            'supported_types' => 'Supported: Images (JPEG, PNG, GIF, WebP, SVG), Videos (MP4, WebM, MOV), Documents (PDF, DOC, DOCX, XLS, XLSX)',
            'max_size' => 'Max file size: 50MB',
            'files_count' => 'Files (:count)',
            'clear_completed' => 'Clear completed (:count)',
            'upload_all' => 'Upload All (:count)',
            'pending' => 'Pending',
            'retry' => 'Retry',
            'back' => 'Back to Library',
            'upload_failed' => 'Upload failed',
        ],
        'edit' => [
            'title' => 'Edit: :name',
            'head' => 'Edit Media',
            'preview' => 'Preview',
            'details' => 'Edit Details',
            'file' => 'File',
            'type' => 'Type',
            'size' => 'Size',
            'submit' => 'Save Changes',
            'back' => 'Back to Library',
        ],
        'show' => [
            'title' => 'Media: :name',
            'head' => 'Media Details',
            'preview' => 'Preview',
            'information' => 'File Information',
            'original_name' => 'Original Name',
            'file_name' => 'File Name',
            'mime_type' => 'MIME Type',
            'size' => 'Size',
            'alt_text' => 'Alt Text',
            'description' => 'Description',
            'uploaded' => 'Uploaded',
            'last_modified' => 'Last Modified',
            'url' => 'URL',
            'copy' => 'Copy',
            'copied' => 'Copied!',
            'preview_unavailable' => 'Preview not available for this file type',
            'download' => 'Download File',
            'back' => 'Back to Library',
        ],
    ],

    'actions' => [
        'edit' => 'Edit',
        'delete' => 'Delete',
        'view' => 'Preview',
    ],

    'delete_confirm' => [
        'title' => 'Delete Media',
        'message' => 'Are you sure you want to delete file ":name"? This action cannot be undone.',
        'message_generic' => 'Are you sure you want to delete this file?',
        'bulk_title' => 'Delete Selected Media',
        'bulk_message' => 'Are you sure you want to delete :count selected file(s)? This action cannot be undone.',
    ],

    'validation' => [
        'file_required' => 'Please select a file to upload.',
        'file_invalid' => 'The uploaded file is invalid.',
        'file_max' => 'The file size must not exceed 50MB.',
        'file_mimes' => 'The file type is not supported. Allowed types: images, documents, and videos.',
        'alt_text_max' => 'The alt text must not exceed 255 characters.',
        'description_max' => 'The description must not exceed 1000 characters.',
    ],

    'messages' => [
        'created' => 'Media uploaded successfully.',
        'updated' => 'Media updated successfully.',
        'deleted' => 'Media deleted successfully.',
        'bulk_deleted' => ':count media files deleted successfully.',
    ],
];
