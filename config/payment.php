<?php

return [
    'driver' => env('PAYMENT_DRIVER', 'manual_transfer'),

    'manual_transfer' => [
        'bank_name' => env('PAYMENT_BANK_NAME', 'BCA'),
        'bank_account_number' => env('PAYMENT_BANK_ACCOUNT_NUMBER', '1234567890'),
        'bank_account_name' => env('PAYMENT_BANK_ACCOUNT_NAME', 'PT Seruwit Digital Nusantara'),
    ],
];
