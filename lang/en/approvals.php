<?php

return [
    'nav' => [
        'inbox' => 'Inbox',
        'policies' => 'Policies',
    ],

    'inbox' => [
        'title' => 'Approval Inbox',
        'head' => 'Approvals',
        'new_policy' => 'New Policy',
        'pending_banner' => ':count request(s) awaiting approval.',
        'empty' => 'No requests.',
        'all_triggers' => 'All triggers',
        'columns' => [
            'code' => 'Code',
            'policy' => 'Policy',
            'trigger' => 'Trigger',
            'level' => 'Level',
            'by' => 'By',
            'date' => 'Date',
            'status' => 'Status',
        ],
    ],

    'request' => [
        'back' => 'Back',
        'policy' => 'Policy',
        'trigger' => 'Trigger',
        'current_level' => 'Current level',
        'requested_by' => 'Requested by',
        'subject' => 'Subject',
        'payload' => 'Payload',
        'levels' => 'Levels',
        'history' => 'History',
        'history_line' => ':action by :actor (L:level)',
        'note_placeholder' => 'Note (optional)',
        'approve' => 'Approve',
        'reject' => 'Reject',
    ],

    'policies' => [
        'title' => 'Approval Policies',
        'head' => 'Approval Policies',
        'new' => 'New Policy',
        'subtitle' => 'Configure multi-level flows without code: discounts, credit limits, large POs, and out-of-SLA orders.',
        'empty' => 'No policies yet. Create one to get started.',
        'edit' => 'Edit',
        'active' => 'Active',
        'inactive' => 'Inactive',
        'pending_count' => ':count pending',
        'delete_confirm' => 'Delete policy ":name"? This cannot be undone.',
        'columns' => [
            'name' => 'Name',
            'trigger' => 'Trigger',
            'levels' => 'Levels',
            'status' => 'Status',
        ],
    ],

    'form' => [
        'new_title' => 'New Policy',
        'edit_title' => 'Edit Policy',
        'key' => 'Key *',
        'name' => 'Name *',
        'trigger' => 'Trigger *',
        'active' => 'Active',
        'levels' => 'Levels *',
        'add_level' => '+ Level',
        'level_n' => 'Level :n',
        'level_number' => 'Level #',
        'level_name' => 'Name',
        'yes' => 'Yes',
        'cancel' => 'Cancel',
        'create' => 'Create',
        'update' => 'Update',
        'approver_types' => [
            'permission' => 'Permission',
            'role' => 'Role',
            'user' => 'User',
        ],
    ],

    'status' => [
        'pending' => 'Pending',
        'approved' => 'Approved',
        'rejected' => 'Rejected',
        'cancelled' => 'Cancelled',
        'commented' => 'Commented',
        'all' => 'All statuses',
    ],

    'triggers' => [
        'po_amount' => [
            'label' => 'Large PO',
            'description' => 'Purchase orders whose total meets or exceeds the threshold.',
            'min_amount' => 'Minimum PO total',
        ],
        'credit_limit' => [
            'label' => 'Credit limit',
            'description' => 'Invoice issues that would exceed the partner credit limit.',
            'requires_exceeded' => 'Only when the limit is exceeded',
        ],
        'order_discount' => [
            'label' => 'Order discount',
            'description' => 'DO confirmations with a discount above the threshold.',
            'min_discount_percent' => 'Minimum discount %',
        ],
        'order_sla' => [
            'label' => 'Out-of-SLA order',
            'description' => 'DO confirmations with a promised delivery faster than the SLA lead time.',
            'max_lead_hours' => 'Minimum lead time (hours)',
        ],
    ],

    'messages' => [
        'policy_created' => 'Approval policy created.',
        'policy_updated' => 'Approval policy updated.',
        'policy_deleted' => 'Approval policy deleted.',
        'policy_has_pending' => 'Cannot delete a policy with pending requests.',
        'approved' => 'Approved.',
        'rejected' => 'Rejected.',
    ],
];
