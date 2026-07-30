<?php

namespace Modules\Receivables\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentGatewayConfig extends Model
{
    public const PROVIDER_MIDTRANS = 'midtrans';

    /** @var list<string> */
    protected $fillable = [
        'provider',
        'is_enabled',
        'is_production',
        'server_key',
        'client_key',
        'merchant_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'is_production' => 'boolean',
            'server_key' => 'encrypted',
            'client_key' => 'encrypted',
        ];
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'provider' => self::PROVIDER_MIDTRANS,
            'is_enabled' => false,
            'is_production' => (bool) config('services.midtrans.is_production', false),
            'server_key' => config('services.midtrans.server_key'),
            'client_key' => config('services.midtrans.client_key'),
        ]);
    }

    public function isConfigured(): bool
    {
        return $this->is_enabled
            && filled($this->server_key)
            && filled($this->client_key);
    }

    public function snapBaseUrl(): string
    {
        return $this->is_production
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com';
    }

    public function apiBaseUrl(): string
    {
        return $this->is_production
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    }

    /**
     * Public-safe payload for Inertia (never exposes secret keys).
     *
     * @return array{provider: string, is_enabled: bool, is_production: bool, merchant_id: string|null, has_server_key: bool, has_client_key: bool, client_key: string|null}
     */
    public function toPublicArray(): array
    {
        return [
            'provider' => $this->provider,
            'is_enabled' => $this->is_enabled,
            'is_production' => $this->is_production,
            'merchant_id' => $this->merchant_id,
            'has_server_key' => filled($this->server_key),
            'has_client_key' => filled($this->client_key),
            // Client key is used by Snap.js / hosted page; safe to expose when enabled.
            'client_key' => $this->isConfigured() ? $this->client_key : null,
        ];
    }
}
