<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Default Traccar server for the Tracking module. Base URL only: every
     * tenant points at the same company-run server, so defaulting it saves
     * setup friction. Credentials are deliberately absent — each tenant's own
     * Traccar account is what scopes which devices it can see, so they live
     * per-tenant in tracking_configs (encrypted), never here.
     */
    'traccar' => [
        'base_url' => env('TRACCAR_BASE_URL'),
    ],

    /*
     * OSRM host used to turn trip stop waypoints into a road-following polyline.
     * Default is the public demo; override with a self-hosted instance for production.
     */
    /*
     * Midtrans Snap defaults for local/sandbox. Prefer empty in production —
     * tenants store encrypted keys in payment_gateway_configs.
     */
    'midtrans' => [
        'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_VISION_MODEL', 'gemini-1.5-flash'),
        'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    ],

];
