<?php

namespace Modules\Approvals\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalAction extends Model
{
    public const ACTION_APPROVED = 'approved';

    public const ACTION_REJECTED = 'rejected';

    public const ACTION_COMMENTED = 'commented';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'approval_request_id',
        'level',
        'actor_id',
        'action',
        'note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'level' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<ApprovalRequest, $this>
     */
    public function request(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'actor_id');
    }
}
