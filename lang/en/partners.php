<?php

return [
    'title' => 'Partners',

    'status' => [
        'active' => 'Active',
        'inactive' => 'Inactive',
        'all' => 'All statuses',
    ],

    'account_type' => [
        'company' => 'Company',
        'individual' => 'Individual',
        'all' => 'All types',
    ],

    'role' => [
        'customer' => 'Customer',
        'supplier' => 'Supplier',
        'all' => 'All roles',
    ],

    'address_type' => [
        'shipping' => 'Shipping',
        'billing' => 'Billing',
        'warehouse' => 'Warehouse',
    ],

    'fields' => [
        'account_type' => 'Account Type',
        'name' => 'Name',
        'title' => 'Title',
        'job_title' => 'Job Title',
        'parent_company' => 'Parent Company',
        'phone' => 'Phone',
        'mobile' => 'Mobile / WhatsApp',
        'email' => 'Email',
        'website' => 'Website',
        'industry' => 'Industry',
        'tax_id' => 'Tax ID (NPWP)',
        'credit_limit' => 'Credit Limit',
        'tags' => 'Tags',
        'address' => 'Primary Address',
        'notes' => 'Notes',
        'comment' => 'Internal Comment',
        'status' => 'Status',
        'type' => 'Type',
        'label' => 'Label',
        'street' => 'Address',
        'city' => 'City',
        'province' => 'Province',
        'zip' => 'Postal Code',
        'country' => 'Country',
        'bank_name' => 'Bank Name',
        'account_number' => 'Account Number',
        'account_holder' => 'Account Holder',
        'is_default' => 'Default',
        'code' => 'Code',
    ],

    'placeholders' => [
        'search' => 'Search name, code, phone, email, tax ID…',
        'select_title' => 'Select title',
        'select_company' => 'Select company',
        'select_industry' => 'Select industry',
        'address_label' => 'e.g. Head Office',
        'none' => 'None',
    ],

    'index' => [
        'head' => 'Partners',
        'new' => 'Add Partner',
        'empty_title' => 'No partners yet',
        'empty_hint' => 'Get started by adding a new partner.',
        'columns' => [
            'code' => 'Code',
            'name' => 'Name',
            'role' => 'Role',
            'phone' => 'Phone',
            'industry' => 'Industry',
            'status' => 'Status',
        ],
        'delete_title' => 'Delete Partner',
        'delete_confirm' => 'Are you sure you want to delete ":name" (:code)? This cannot be undone.',
        'delete_confirm_generic' => 'Are you sure you want to delete this partner?',
    ],

    'create' => [
        'title' => 'Add Partner',
        'head' => 'Add Partner',
        'submit' => 'Save Partner',
    ],

    'edit' => [
        'title' => 'Edit :name',
        'head' => 'Edit Partner',
        'submit' => 'Save Changes',
    ],

    'show' => [
        'general' => 'General Information',
        'contact' => 'Contact',
        'contacts' => 'Contact Persons',
        'addresses' => 'Addresses',
        'bank_accounts' => 'Bank Accounts',
        'notes_section' => 'Notes',
        'add_address' => '+ Add Address',
        'add_bank_account' => '+ Add Bank Account',
        'save_address' => 'Save Address',
        'save_bank_account' => 'Save Bank Account',
        'empty_addresses' => 'No addresses yet.',
        'empty_bank_accounts' => 'No bank accounts yet.',
        'delete_zone_title' => 'Delete this partner',
        'delete_zone_hint' => 'This cannot be undone.',
        'delete_action' => 'Delete Partner',
        'delete_title' => 'Delete Partner',
        'delete_confirm' => 'Are you sure you want to delete ":name" (:code)? This cannot be undone.',
        'bank_columns' => [
            'bank' => 'Bank',
            'account_number' => 'Account Number',
            'account_holder' => 'Account Holder',
        ],
    ],

    'validation' => [
        'account_type_in' => 'Account type must be company or individual.',
        'status_in' => 'Please select a valid status.',
    ],

    'messages' => [
        'created' => 'Partner created successfully.',
        'updated' => 'Partner updated successfully.',
        'deleted' => 'Partner deleted successfully.',
        'delete_referenced' => 'This partner is still referenced by other data and cannot be deleted.',
        'address_created' => 'Address added successfully.',
        'address_deleted' => 'Address deleted successfully.',
        'bank_account_created' => 'Bank account added successfully.',
        'bank_account_deleted' => 'Bank account deleted successfully.',
    ],
];
