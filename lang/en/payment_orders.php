<?php

return [
    'title' => 'Payment Orders',
    'description' => 'Manage subscription payment verification for tenants',

    'statuses' => [
        'pending' => 'Pending',
        'awaiting_confirmation' => 'Awaiting Confirmation',
        'confirmed' => 'Confirmed',
        'rejected' => 'Rejected',
        'expired' => 'Expired',
        'cancelled' => 'Cancelled',
    ],

    'types' => [
        'activate' => 'Activation',
        'renew' => 'Renewal',
        'activate_new' => 'New Activation',
    ],

    'index' => [
        'search_placeholder' => 'Search tenant name…',
        'search_button' => 'Search',
        'status_all' => 'All Statuses',
        'reset' => 'Reset',
        'empty_filtered' => 'No orders match the filter',
        'empty_all' => 'No payment orders yet',
        'clear_filter' => 'Clear filter',
        'columns' => [
            'number' => '#',
            'tenant' => 'Tenant',
            'plan' => 'Plan',
            'total' => 'Total',
            'status' => 'Status',
            'date' => 'Date',
        ],
        'actions_menu' => 'Actions',
        'view_detail' => 'View Detail',
        'showing' => 'Showing :from–:to of :total orders',
        'showing_count' => ':total orders',
    ],

    'show' => [
        'page_title' => 'Order #:id',
        'back' => 'Back to list',
        'created_at' => 'Created :date',
        'expires_at' => '· Expires :date',
        'total_transfer_label' => 'Total Transfer',

        'breakdown' => [
            'title' => 'Amount Breakdown',
            'plan_price' => 'Plan price',
            'unique_code' => 'Unique code',
            'total' => 'Total transfer',
        ],

        'bank' => [
            'title' => 'Transfer Instructions',
            'name' => 'Bank',
            'account_number' => 'Account Number',
            'account_name' => 'Account Name',
        ],

        'workspace' => [
            'title' => 'Workspace Details',
            'tenant' => 'Tenant',
            'tenant_status' => 'Tenant status',
            'trial_ends' => 'Trial ends',
            'plan' => 'Plan',
            'interval' => 'Interval',
            'order_type' => 'Order type',
        ],

        'confirmed_block' => [
            'title' => 'Payment confirmed',
            'by' => 'By :name · :date',
        ],

        'rejected_block' => [
            'title' => 'Payment rejected',
            'by' => 'By :name · :date',
        ],

        'proof' => [
            'title' => 'Transfer Proof',
            'download' => 'Download transfer proof',
            'tenant_note' => 'Note from tenant',
            'empty_title' => 'No transfer proof yet',
            'empty_hint' => 'The tenant has not uploaded proof of payment',
            'expand' => 'Expand ↗',
            'open_tab' => 'Open in new tab',
        ],

        'subscription' => [
            'title' => 'Related Subscription',
            'id' => 'Subscription ID',
            'status' => 'Status',
            'ends_at' => 'Ends',
        ],

        'actions' => [
            'reject' => 'Reject',
            'confirm' => 'Confirm',
        ],

        'confirm_modal' => [
            'title' => 'Confirm Payment',
            'subtitle' => 'This action cannot be undone',
            'body' => 'You are about to confirm a transfer of :amount from :tenant. The :plan plan subscription will be activated immediately.',
            'cancel' => 'Cancel',
            'submit' => 'Yes, Confirm',
            'saving' => 'Saving…',
        ],

        'reject_modal' => [
            'title' => 'Reject Payment',
            'subtitle' => 'The reason will be sent to the tenant',
            'placeholder' => 'e.g. Transfer amount does not match, please transfer exactly Rp 500,123…',
            'cancel' => 'Cancel',
            'submit' => 'Reject Payment',
            'saving' => 'Saving…',
        ],

        'copy' => 'Copy',
    ],
];
