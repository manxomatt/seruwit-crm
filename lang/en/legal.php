<?php

return [
    'terms' => [
        'page_title' => 'Terms & Conditions',
        'badge' => '⚖️ Terms of Service & Registration',
        'title' => 'Platform Registration Terms & Conditions',
        'last_updated' => 'Last updated: :date',
        'last_updated_date' => 'August 8, 2026',
        'back_to_register' => 'Back to Registration',
        'copyright' => '© :year :name. All rights reserved.',
        'sections' => [
            'account' => [
                'title' => '1. Account & User Registration Terms',
                'prefix' => 'By registering and creating an account on the',
                'suffix' => 'platform, you represent that you are at least 18 years old or possess legal authority to represent the registered business/entity. All information provided during registration (full name, email address, and business identity) must be accurate and truthful.',
            ],
            'tenant' => [
                'title' => '2. Tenant & Business Workspace Management',
                'content' => 'Your primary registration account acts as the initial owner of the business workspace (tenant workspace). You are fully responsible for all activities, module permission management, invited staff/drivers, and compliance of transaction data managed within your workspace.',
            ],
            'security' => [
                'title' => '3. Password Security & Access Rights',
                'content' => 'Users are entirely responsible for maintaining the confidentiality of their password and account credentials. If any unauthorized access or security breach on your account is detected, please immediately contact our system support team.',
            ],
            'intellectual_property' => [
                'title' => '4. Usage Restrictions & Intellectual Property Rights',
                'content' => 'All copyrights, trademarks, and source code of this platform are exclusively owned by the platform provider. Users are prohibited from misusing the system, reverse engineering, or utilizing the platform for activities that violate applicable laws in the Republic of Indonesia.',
            ],
        ],
    ],
    'privacy' => [
        'page_title' => 'Privacy Policy',
        'badge' => '🔒 Data Protection & Privacy',
        'title' => 'User Privacy Policy',
        'last_updated' => 'Last updated: :date',
        'last_updated_date' => 'August 8, 2026',
        'back_to_register' => 'Back to Registration',
        'copyright' => '© :year :name. All rights reserved.',
        'sections' => [
            'collection' => [
                'title' => '1. Personal & Business Information Collection',
                'prefix' => 'We collect information you provide directly upon account registration and workspace setup, including username, email address, business phone number, and operational service transaction information managed within the',
                'suffix' => 'platform.',
            ],
            'usage' => [
                'title' => '2. Data Use & Processing Purposes',
                'content' => 'The collected data is used exclusively to operate the CRM platform, verify user identity, handle billing & reservations, provide customer support services, and continuously enhance platform performance and security.',
            ],
            'security' => [
                'title' => '3. Data Security & Tenant Isolation',
                'content' => 'All tenant data is stored with multi-tenancy database schema isolation and industry-standard network encryption. We never sell or share your private business data with third parties without your explicit written consent.',
            ],
            'rights' => [
                'title' => '4. User Rights & Data Retention',
                'content' => 'Users have the right to request data updates, business transaction data exports, or account deletion in accordance with applicable personal data protection procedures and regulations.',
            ],
        ],
    ],
];
