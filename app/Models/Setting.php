<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    /** @use HasFactory<\Database\Factories\SettingFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
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
     * Get the attributes that should be cast.
     *
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
     * Get a setting value by key.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        return $setting?->value ?? $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function setValue(string $key, mixed $value): bool
    {
        return (bool) static::where('key', $key)->update(['value' => $value]);
    }

    /**
     * Get all settings grouped by their group.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, static>
     */
    public static function getGrouped(): \Illuminate\Database\Eloquent\Collection
    {
        return static::query()
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('group');
    }

    /**
     * Get all public settings.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, static>
     */
    public static function getPublic(): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('is_public', true)
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Scope a query to filter by group.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeGroup(\Illuminate\Database\Eloquent\Builder $query, string $group): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('group', $group);
    }
}
