<?php

namespace Modules\Canvassing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Canvassing\Database\Factories\CanvassingVisitFactory;
use Modules\Partners\Models\Partner;

class CanvassingVisit extends Model
{
    /** @use HasFactory<CanvassingVisitFactory> */
    use HasFactory;

    public const OUTCOME_PENDING = 'pending';

    public const OUTCOME_CONTACTED = 'contacted';

    public const OUTCOME_NO_CONTACT = 'no_contact';

    public const OUTCOME_INTERESTED = 'interested';

    public const OUTCOME_NOT_INTERESTED = 'not_interested';

    public const OUTCOME_CALLBACK = 'callback';

    protected static function newFactory(): Factory
    {
        return CanvassingVisitFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'salesperson_id',
        'partner_id',
        'plan_id',
        'submitted_by',
        'checked_in_at',
        'checked_out_at',
        'latitude',
        'longitude',
        'outcome',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    /** @return BelongsTo<Salesperson, $this> */
    public function salesperson(): BelongsTo
    {
        return $this->belongsTo(Salesperson::class);
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<CanvassingPlan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(CanvassingPlan::class, 'plan_id');
    }

    /** @return BelongsTo<User, $this> */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /** @return HasMany<CanvassingPhoto, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(CanvassingPhoto::class);
    }

    /**
     * Whether this visit is currently open (checked in, not yet checked out).
     */
    public function getIsOpenAttribute(): bool
    {
        return $this->checked_out_at === null;
    }

    /** @param Builder<self> $query */
    public function scopeToday(Builder $query): void
    {
        $query->whereDate('checked_in_at', today());
    }

    /** @param Builder<self> $query */
    public function scopeOpen(Builder $query): void
    {
        $query->whereNull('checked_out_at');
    }
}
