<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * A platform-global setting, stored in the CENTRAL schema and managed only by
 * the central admin.
 *
 * Counterpart to App\Models\Setting, which is tenant-scoped (each tenant admin
 * manages its own values in the tenant schema). Pinned to the central
 * connection — like ModuleSetting — so it reads correctly even from tenant
 * context, where the default connection points at the tenant schema.
 */
class PlatformSetting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'group',
        'value',
        'type',
        'label',
        'description',
        'is_public',
        'sort_order',
    ];

    /**
     * Pinned to the central connection. Without this, reading a platform setting
     * from tenant context would hit the tenant schema, where this table does not
     * exist.
     */
    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get a platform setting value by key.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        return static::query()->where('key', $key)->value('value') ?? $default;
    }

    /**
     * Create or update a platform setting value by key, filling required columns
     * with sensible defaults on first write.
     */
    public static function setValue(string $key, mixed $value): bool
    {
        $setting = static::query()->firstOrNew(['key' => $key]);

        $setting->value = $value;

        if (! $setting->exists) {
            $setting->group = $setting->group ?: 'general';
            $setting->label = $setting->label ?: $key;
        }

        return $setting->save();
    }

    /**
     * All platform settings keyed by their group.
     *
     * @return Collection<int, static>
     */
    public static function getGrouped(): Collection
    {
        return static::query()
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('group');
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }
}
