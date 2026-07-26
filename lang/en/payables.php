<?php

return [
    'title' => 'Payables',

    'nav' => [
        'bills' => 'Supplier Bills',
        'payments' => 'Payments',
    ],

    'status' => [
        'draft' => 'Draft',
        'issued' => 'Issued',
        'partially_paid' => 'Partially paid',
        'paid' => 'Paid',
        'void' => 'Void',
        'posted' => 'Posted',
        'voided' => 'Voided',
    ],

    'messages' => [
        'module_unavailable' => 'Payables module is not available.',
        'grn_confirmed_only' => 'Only a confirmed GRN can be billed.',
        'grn_already_billed' => 'This GRN already has an active supplier bill.',
        'bill_created' => 'Draft supplier bill created from GRN.',
        'bill_from_grn_notes' => 'Created from GRN :grn (PO :po)',
        'bill_line_description' => ':grn — :product × :qty :unit',
        'bill_issued' => 'Supplier bill issued.',
        'bill_voided' => 'Supplier bill voided.',
        'issue_draft_only' => 'Only a draft bill can be issued.',
        'void_not_allowed' => 'This bill cannot be voided.',
        'void_has_payments' => 'Cannot void a bill that has payments.',
        'payment_recorded' => 'Bill payment recorded.',
        'payment_voided' => 'Bill payment voided.',
    ],

    'validation' => [
        'allocations_empty' => 'Add at least one bill allocation.',
        'amount_mismatch' => 'Payment amount must equal the sum of allocations.',
        'bill_wrong_partner' => 'Bill :code does not belong to this supplier.',
        'bill_not_open' => 'Bill :code is not open for payment.',
        'allocation_invalid' => 'Invalid allocation for bill :code.',
        'payment_already_void' => 'Payment is already voided.',
    ],

    'bills' => [
        'title' => 'Supplier Bills',
        'empty' => 'No supplier bills yet.',
        'issue' => 'Issue Bill',
        'void' => 'Void',
        'pay' => 'Record Payment',
        'from_grn' => 'Create Bill',
    ],

    'payments' => [
        'title' => 'Bill Payments',
        'create' => 'Record Payment',
        'empty' => 'No payments yet.',
    ],
];
