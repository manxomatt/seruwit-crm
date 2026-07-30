<?php

return [
    'title' => 'Receivables',

    'nav' => [
        'payments' => 'Payments',
        'aging' => 'Aging',
        'credit_limits' => 'Credit Limits',
        'gateway' => 'Payment gateway',
    ],

    'status' => [
        'posted' => 'Posted',
        'voided' => 'Voided',
    ],

    'types' => [
        'down_payment' => 'DP',
        'down_payment_full' => 'DP (Down Payment)',
        'installment' => 'Installment',
        'settlement' => 'Settlement',
        'other' => 'Other',
    ],

    'methods' => [
        'cash' => 'Cash',
        'transfer' => 'Transfer',
        'giro' => 'Giro',
        'card' => 'Card',
        'qris' => 'QRIS / e-wallet',
        'other' => 'Other',
    ],

    'buckets' => [
        'current' => 'Current',
        '1_30' => '1–30',
        '31_60' => '31–60',
        '61_90' => '61–90',
        '90_plus' => '90+',
    ],

    'fields' => [
        'partner' => 'Partner',
        'partner_customer' => 'Partner (Customer)',
        'payment_date' => 'Payment Date',
        'type' => 'Type',
        'method' => 'Method',
        'amount' => 'Amount',
        'payment_amount' => 'Payment Amount',
        'reference_number' => 'Reference No.',
        'notes' => 'Notes',
        'recorded_by' => 'Recorded by',
        'date' => 'Date',
        'due' => 'Due',
        'balance' => 'Balance',
        'allocation' => 'Allocation',
        'allocated' => 'Allocated',
        'limit' => 'Limit',
        'outstanding' => 'Outstanding',
        'available' => 'Available',
        'utilization' => 'Utilization',
        'days_past_due' => 'Days PD',
        'bucket' => 'Bucket',
        'code' => 'Code',
        'invoice' => 'Invoice',
        'type_method' => 'Type / Method',
        'status' => 'Status',
    ],

    'placeholders' => [
        'select' => '— select —',
        'search' => 'Search code / reference…',
        'reference' => 'Transfer / giro no.',
    ],

    'actions' => [
        'search' => 'Search',
        'back' => 'Back',
        'void' => 'Void',
        'pay' => 'Pay',
        'full' => 'Full',
        'match_amount' => 'Match',
    ],

    'payments' => [
        'index' => [
            'title' => 'Receivables',
            'head' => 'Receivables — Payments',
            'record' => 'Record Payment',
            'open_ar' => 'Open AR',
            'received_this_month' => 'Received this month',
            'empty' => 'No payments yet.',
            'overdue_alert' => ':count invoice overdue — :amount past due.',
            'view_aging' => 'View aging',
            'all_statuses' => 'All statuses',
        ],
        'create' => [
            'title' => 'Record Payment',
            'allocation_hint' => 'Allocated: :amount',
            'allocation_section' => 'Allocate to Invoices',
            'select_partner_hint' => 'Select a partner to view open invoices.',
            'no_open_invoices' => 'No open invoices for this partner.',
            'submit' => 'Save Payment',
            'client_allocations_required' => 'Allocate the payment to at least one invoice.',
        ],
        'show' => [
            'void_confirm' => 'Void this payment? Allocations will be removed from invoices.',
            'allocations' => 'Allocations',
        ],
    ],

    'aging' => [
        'index' => [
            'title' => 'AR Aging',
            'alert' => 'Alert: :count overdue · :amount',
            'empty' => 'No open receivables.',
        ],
    ],

    'credit' => [
        'index' => [
            'title' => 'Credit Limits',
            'over_limit_alert' => ':count partner(s) exceed credit limit.',
            'empty' => 'No partners with credit limits. Set in Partners → Edit.',
        ],
    ],

    'messages' => [
        'payment_recorded' => 'Payment recorded.',
        'payment_voided' => 'Payment voided.',
    ],

    'validation' => [
        'allocations_required' => 'Allocate the payment to at least one invoice.',
        'amount_gt' => 'Payment amount must be greater than zero.',
        'allocations_empty' => 'At least one invoice allocation is required.',
        'amount_mismatch' => 'Payment amount must equal the sum of allocations.',
        'invoice_wrong_partner' => 'Invoice :code does not belong to this partner.',
        'invoice_not_open' => 'Invoice :code is not open for payment.',
        'allocation_gt_zero' => 'Allocation amounts must be greater than zero.',
        'allocation_exceeds_balance' => 'Allocation for :code exceeds the remaining balance.',
        'invoice_no_balance' => 'Invoice has no remaining balance.',
        'void_posted_only' => 'Only a posted payment can be voided.',
    ],

    'gateway' => [
        'title' => 'Midtrans Snap',
        'subtitle' => 'Online deposit and invoice payments for this workspace.',
        'config_saved' => 'Payment gateway settings saved.',
        'not_configured' => 'Midtrans is not configured or not enabled for this workspace.',
        'unreachable' => 'Could not reach Midtrans. Try again shortly.',
        'snap_failed' => 'Midtrans rejected the charge: :message',
        'snap_invalid_response' => 'Midtrans returned an incomplete Snap response.',
        'invalid_signature' => 'Invalid Midtrans signature.',
        'deposit_none' => 'This rental has no deposit to collect.',
        'deposit_already_received' => 'Deposit has already been received.',
        'deposit_status_invalid' => 'Deposit can only be paid online for draft, confirmed, or active rentals.',
        'invoice_nothing_due' => 'This invoice has no remaining balance.',
        'invoice_not_open' => 'Only issued invoices can be paid online.',
        'item_deposit' => 'Rental deposit :code',
        'item_invoice' => 'Invoice :code',
        'payment_note' => 'Midtrans :order',
        'enabled' => 'Enable Midtrans Snap',
        'production' => 'Production mode',
        'server_key' => 'Server key',
        'client_key' => 'Client key',
        'merchant_id' => 'Merchant ID (optional)',
        'server_key_hint' => 'Leave blank to keep the current key.',
        'client_key_hint' => 'Leave blank to keep the current key.',
        'pay_deposit' => 'Pay deposit via Midtrans',
        'pay_invoice' => 'Pay via Midtrans',
        'webhook_hint' => 'Notification URL: :url',
    ],
];
