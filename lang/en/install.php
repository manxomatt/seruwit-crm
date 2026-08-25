<?php

return [
    'title' => 'Install',
    'subtitle' => 'First-time setup',

    'steps' => [
        'welcome' => 'Welcome',
        'requirements' => 'Requirements',
        'database' => 'Database',
        'migrate' => 'Migrate',
        'platform' => 'Platform',
        'admin' => 'Admin',
        'complete' => 'Complete',
    ],

    'welcome' => [
        'heading' => 'Welcome',
        'intro' => 'This wizard sets up the platform control plane and creates the first administrator. Workspaces and modules are added afterwards.',
        'start' => 'Get started',
    ],

    'token' => [
        'heading' => 'Installer token',
        'label' => 'Installer token',
        'hint' => 'This deployment requires a token to run the installer. Get it by running php artisan app:install-token.',
        'invalid' => 'Invalid installer token.',
        'unlock' => 'Unlock',
    ],

    'requirements' => [
        'heading' => 'Server requirements',
        'intro' => 'These must be satisfied before installing.',
        'all_passed' => 'All requirements are met.',
        'some_failed' => 'Some requirements are not met. Fix them, then reload.',
    ],

    'database' => [
        'heading' => 'Database connection',
        'intro' => 'Enter the credentials for the central database. They are verified before anything is written.',
        'driver' => 'Driver',
        'host' => 'Host',
        'port' => 'Port',
        'database' => 'Database name',
        'username' => 'Username',
        'password' => 'Password',
        'submit' => 'Test & save',
    ],

    'migrate' => [
        'heading' => 'Create the schema',
        'intro' => 'Run the central migrations and seed the platform (roles, permissions, plans). This may take a moment.',
        'run' => 'Run migrations',
        'running' => 'Migrating…',
    ],

    'platform' => [
        'heading' => 'Platform profile',
        'intro' => 'Name the application and choose how the central domain behaves.',
        'app_name' => 'Application name',
        'app_url' => 'Application URL',
        'tenant_base_domain' => 'Tenant base domain',
        'tenant_base_domain_hint' => 'Leave blank to use the APP_URL host.',
        'profile' => 'Deployment profile',
        'profile_development' => 'Development — central serves the full CRM',
        'profile_production' => 'Production — central is the control plane only',
        'ai_features' => 'Enable AI features',
        'submit' => 'Save profile',
    ],

    'admin' => [
        'heading' => 'Administrator account',
        'intro' => 'Create the first platform administrator.',
        'name' => 'Name',
        'email' => 'Email',
        'password' => 'Password',
        'password_confirmation' => 'Confirm password',
        'submit' => 'Create admin',
    ],

    'complete' => [
        'heading' => 'Ready to launch',
        'intro' => 'Everything is configured. Finishing seals the installer and takes you to the application.',
        'launch' => 'Finish & launch',
    ],

    'actions' => [
        'next' => 'Next',
        'back' => 'Back',
    ],
];
