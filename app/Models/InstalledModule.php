<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A module's install state within the current tenant's schema.
 *
 * A row with a null uninstalled_at is installed. A row with uninstalled_at set is
 * uninstalled but still holding its data until the purge grace period lapses;
 * reinstalling before then restores everything.
 */
class InstalledModule extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'installed_at',
        'uninstalled_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'installed_at' => 'datetime',
            'uninstalled_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<$this>  $query
     */
    public function scopeInstalled(Builder $query): void
    {
        $query->whereNull('uninstalled_at');
    }

    /**
     * @param  Builder<$this>  $query
     */
    public function scopeUninstalled(Builder $query): void
    {
        $query->whereNotNull('uninstalled_at');
    }

    public function isInstalled(): bool
    {
        return $this->uninstalled_at === null;
    }
}
