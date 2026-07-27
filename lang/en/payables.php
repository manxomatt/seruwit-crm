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
        'line_updated' => 'Bill line amount updated.',
        'line_edit_draft_only' => 'Bill lines can only be edited while the bill is draft.',
        'match_tolerance_exceeded' => 'Cannot issue: billed amount differs from PO×GRN expected amount beyond match tolerance.',
        'credit_from_return_notes' => 'Credit from purchase return :return (PO :po)',
        'credit_line_description' => 'Credit :return — :product × :qty',
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
        'expected' => 'Expected (PO×GRN)',
        'billed' => 'Billed',
        'variance' => 'Variance',
        'match_ok' => '3-way match within tolerance',
        'match_warn' => 'Variance exceeds match tolerance — adjust billed amount or settings before issue',
        'save_line' => 'Save',
    ],

    'payments' => [
        'title' => 'Bill Payments',
        'create' => 'Record Payment',
        'empty' => 'No payments yet.',
        'open_bills' => 'Open bills',
        'no_open_bills' => 'No open bills for this supplier.',
    ],

    'fields' => [
        'supplier' => 'Supplier',
        'payment_date' => 'Payment date',
        'method' => 'Method',
        'amount' => 'Amount',
        'reference' => 'Reference',
        'notes' => 'Notes',
    ],

    'placeholders' => [
        'select_supplier' => 'Select supplier',
        'search_supplier' => 'Search supplier…',
        'select_method' => 'Select method',
    ],

    'methods' => [
        'cash' => 'Cash',
        'transfer' => 'Transfer',
        'giro' => 'Giro',
        'other' => 'Other',
    ],
];
