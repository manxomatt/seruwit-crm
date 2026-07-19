<?php

namespace Modules\Document\Models;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Document\Database\Factories\DocumentFactory;

/**
 * Represents a single compliance document attached to a vehicle or driver.
 *
 * Soft delete = "superseded": uploading a renewal soft-deletes the previous
 * row so it remains as auditable history without affecting status queries.
 * Hard deletion only happens via modules:purge-expired.
 */
class Document extends Model
{
    /** @use HasFactory<DocumentFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_PERMANENT = 'permanent';

    public const STATUS_VALID = 'valid';

    public const STATUS_EXPIRING_SOON = 'expiring_soon';

    public const STATUS_EXPIRED = 'expired';

    protected static function newFactory(): Factory
    {
        return DocumentFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'document_type_id',
        'documentable_type',
        'documentable_id',
        'document_number',
        'issued_at',
        'expires_at',
        'notes',
        'media_id',
        'uploaded_by',
        'verified_by',
        'verified_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'expires_at' => 'date',
            'verified_at' => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────

    /**
     * @return BelongsTo<DocumentType, $this>
     */
    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<Media, $this>
     */
    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * @return HasMany<DocumentReminder, $this>
     */
    public function reminders(): HasMany
    {
        return $this->hasMany(DocumentReminder::class);
    }

    // ── Computed status ────────────────────────────────────────────────────

    /**
     * Computed from expires_at — never stored. Callers should eager-load
     * documentType so the threshold is precise; falls back to 30 days.
     */
    public function getStatusAttribute(): string
    {
        if ($this->expires_at === null) {
            return self::STATUS_PERMANENT;
        }

        if ($this->expires_at->isPast()) {
            return self::STATUS_EXPIRED;
        }

        $threshold = 30;

        if ($this->relationLoaded('documentType') && $this->documentType !== null) {
            $threshold = $this->documentType->maxReminderDays() ?: 30;
        }

        $daysRemaining = (int) now()->diffInDays($this->expires_at, false);

        return $daysRemaining <= $threshold
            ? self::STATUS_EXPIRING_SOON
            : self::STATUS_VALID;
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    // ── Query scopes ───────────────────────────────────────────────────────

    /**
     * @param  Builder<Document>  $query
     * @return Builder<Document>
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->whereNotNull('expires_at')
            ->whereDate('expires_at', '<', now());
    }

    /**
     * Documents expiring within $days but not yet expired.
     *
     * @param  Builder<Document>  $query
     * @return Builder<Document>
     */
    public function scopeExpiringSoon(Builder $query, int $days = 30): Builder
    {
        return $query->whereNotNull('expires_at')
            ->whereDate('expires_at', '>=', now())
            ->whereDate('expires_at', '<=', now()->addDays($days));
    }

    /**
     * Documents that are valid and not expiring soon.
     *
     * @param  Builder<Document>  $query
     * @return Builder<Document>
     */
    public function scopeValid(Builder $query, int $days = 30): Builder
    {
        return $query->where(function (Builder $q) use ($days): void {
            $q->whereNull('expires_at')
                ->orWhereDate('expires_at', '>', now()->addDays($days));
        });
    }
}
