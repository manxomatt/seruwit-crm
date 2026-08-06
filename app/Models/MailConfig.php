<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class MailConfig extends Model
{
    /** @var list<string> */
    public const ENCRYPTIONS = ['tls', 'ssl', ''];

    /** @var list<string> */
    protected $fillable = [
        'is_enabled',
        'host',
        'port',
        'encryption',
        'username',
        'password',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'port' => 'integer',
            'password' => 'encrypted',
        ];
    }

    public static function tableReady(): bool
    {
        return Schema::hasTable((new static)->getTable());
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'is_enabled' => false,
            'host' => null,
            'port' => 587,
            'encryption' => 'tls',
            'username' => null,
            'password' => null,
        ]);
    }

    public function isConfigured(): bool
    {
        return $this->is_enabled
            && filled($this->host)
            && filled($this->port)
            && filled($this->username)
            && filled($this->password);
    }

    /**
     * Public-safe payload for Inertia (never exposes the SMTP password).
     *
     * @return array{
     *     is_enabled: bool,
     *     host: string|null,
     *     port: int|null,
     *     encryption: string|null,
     *     username: string|null,
     *     has_password: bool,
     *     is_configured: bool
     * }
     */
    public function toPublicArray(): array
    {
        return [
            'is_enabled' => $this->is_enabled,
            'host' => $this->host,
            'port' => $this->port,
            'encryption' => $this->encryption ?? '',
            'username' => $this->username,
            'has_password' => filled($this->password),
            'is_configured' => $this->isConfigured(),
        ];
    }
}
