<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Whether a registered module is turned on platform-wide.
 *
 * Lives in the central database and is pinned to the central connection, so it
 * reads correctly from tenant context — the same reasoning as Plan. No row
 * means enabled; only a disabled module gets a row at all.
 */
class ModuleSetting extends Model
{
    /**
     * Pinned to the central connection.
     *
     * Tenancy swaps the default connection to the tenant's schema, where this
     * table does not exist — so without this, checking a module's platform
     * state from tenant context (on nearly every request) would explode.
     */
    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'is_enabled',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
        ];
    }
}
