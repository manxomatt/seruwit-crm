<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Model;

class MobilePassengerToken extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'phone',
        'token_hash',
        'expires_at',
        'last_used_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at === null || $this->expires_at->isPast();
    }
}
