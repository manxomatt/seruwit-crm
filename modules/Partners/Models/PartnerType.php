<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Partners\Database\Factories\PartnerTypeFactory;

class PartnerType extends Model
{
    /** @use HasFactory<PartnerTypeFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return PartnerTypeFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'description',
        'affects_customer_rank',
        'affects_supplier_rank',
        'is_active',
    ];

    /** @var list<string> */
    protected $appends = [
        'label',
        'description_label',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'affects_customer_rank' => 'boolean',
            'affects_supplier_rank' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function getLabelAttribute(): string
    {
        return $this->localized('name') ?? '';
    }

    public function getDescriptionLabelAttribute(): ?string
    {
        return $this->localized('description');
    }

    public function localized(string $field, ?string $locale = null): ?string
    {
        $locale ??= app()->getLocale();
        $translations = $this->getAttribute($field);

        if (is_string($translations)) {
            $trimmed = trim($translations);

            return $trimmed !== '' ? $trimmed : null;
        }

        if (! is_array($translations) || $translations === []) {
            return null;
        }

        $default = (string) config('localization.default', 'id');

        foreach ([$locale, $default, 'id', 'en'] as $key) {
            $value = trim((string) ($translations[$key] ?? ''));
            if ($value !== '') {
                return $value;
            }
        }

        foreach ($translations as $value) {
            $text = trim((string) $value);
            if ($text !== '') {
                return $text;
            }
        }

        return null;
    }

    /**
     * @param  array<string, string|null>|string|null  $value
     * @return array<string, string>
     */
    public static function normalizeTranslations(array|string|null $value): array
    {
        if (is_string($value)) {
            $text = trim($value);

            return $text === '' ? [] : ['id' => $text, 'en' => $text];
        }

        if (! is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach (['id', 'en'] as $locale) {
            $text = trim((string) ($value[$locale] ?? ''));
            if ($text !== '') {
                $normalized[$locale] = $text;
            }
        }

        return $normalized;
    }

    public static function findByCode(string $code): ?self
    {
        $code = strtolower(trim($code));
        if ($code === '') {
            return null;
        }

        return static::query()->where('code', $code)->first();
    }

    /** @return BelongsToMany<Partner, $this> */
    public function partners(): BelongsToMany
    {
        return $this->belongsToMany(Partner::class, 'partner_partner_type', 'partner_type_id', 'partner_id');
    }
}
