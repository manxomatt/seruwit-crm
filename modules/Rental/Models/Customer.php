<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Partners\Models\Partner;

class Customer extends Authenticatable
{
    use HasFactory, Notifiable;

    /** @var string */
    protected $table = 'customers';

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'name',
        'phone',
        'email',
        'password',
        'phone_verified_at',
        'email_verified_at',
        'last_login_at',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'phone_verified_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    /** @return HasMany<Rental, $this> */
    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class, 'partner_id', 'partner_id');
    }

    public function isKycVerified(): bool
    {
        return $this->partner?->isKycVerified() ?? false;
    }
}
