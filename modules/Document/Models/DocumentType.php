<?php

namespace Modules\Document\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Document\Database\Factories\DocumentTypeFactory;

class DocumentType extends Model
{
    /** @use HasFactory<DocumentTypeFactory> */
    use HasFactory;

    public const ENTITY_VEHICLE = 'vehicle';

    public const ENTITY_DRIVER = 'driver';

    protected static function newFactory(): Factory
    {
        return DocumentTypeFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'entity_type',
        'key',
        'name',
        'description',
        'is_required',
        'has_expiry',
        'typical_validity_days',
        'reminder_days',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'has_expiry' => 'boolean',
            'typical_validity_days' => 'integer',
            'reminder_days' => 'array',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * The largest reminder threshold — used to determine the outer boundary
     * of the "expiring soon" window for dashboard filtering.
     */
    public function maxReminderDays(): int
    {
        $days = $this->reminder_days;

        return empty($days) ? 0 : (int) max($days);
    }
}
