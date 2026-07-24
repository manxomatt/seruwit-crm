<?php

namespace Modules\Approvals\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalRequest extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'approval_policy_id',
        'trigger_type',
        'subject_type',
        'subject_id',
        'status',
        'current_level',
        'payload',
        'requested_by',
        'decided_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'current_level' => 'integer',
            'decided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ApprovalPolicy, $this>
     */
    public function policy(): BelongsTo
    {
        return $this->belongsTo(ApprovalPolicy::class, 'approval_policy_id');
    }

    /**
     * @return MorphTo<\Illuminate\Database\Eloquent\Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return HasMany<ApprovalAction, $this>
     */
    public function actions(): HasMany
    {
        return $this->hasMany(ApprovalAction::class)->orderBy('id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'requested_by');
    }

    public static function nextCode(): string
    {
        $year = now()->format('Y');
        $prefix = "APR-{$year}-";

        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $seq = $last ? ((int) substr((string) $last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}
