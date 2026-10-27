<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    /** @use HasFactory<\Database\Factories\UserProfileFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'phone_number',
        'avatar_url',
    ];

    /**
     * Get the user that owns the profile.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full name of the user.
     */
    public function getFullNameAttribute(): ?string
    {
        if ($this->first_name || $this->last_name) {
            return trim("{$this->first_name} {$this->last_name}");
        }

        return null;
    }

    /**
     * Resolve avatar URL for both central (/storage/...) and tenant (/tenancy/assets/...) contexts.
     */
    public function getAvatarUrlAttribute(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (function_exists('tenancy') && tenancy()->initialized) {
            if (preg_match('#^/storage/(.+)$#', $value, $matches) === 1) {
                try {
                    return route('stancl.tenancy.asset', ['path' => $matches[1]], false);
                } catch (\Throwable) {
                    return $value;
                }
            }

            if (! str_starts_with($value, 'http://') && ! str_starts_with($value, 'https://') && ! str_starts_with($value, '/')) {
                try {
                    return route('stancl.tenancy.asset', ['path' => $value], false);
                } catch (\Throwable) {
                    return '/storage/'.ltrim($value, '/');
                }
            }
        }

        return $value;
    }

    /**
     * Extract the relative storage disk path from an avatar URL.
     */
    public static function storagePathFromUrl(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        if (preg_match('#^/storage/(.+)$#', $url, $matches) === 1) {
            return $matches[1];
        }

        if (preg_match('#^/tenancy/assets/(.+)$#', $url, $matches) === 1) {
            return $matches[1];
        }

        if (! str_starts_with($url, 'http://') && ! str_starts_with($url, 'https://') && ! str_starts_with($url, '/')) {
            return $url;
        }

        return null;
    }
}
