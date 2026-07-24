<?php

namespace Modules\Approvals\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalPolicyLevel extends Model
{
    public const APPROVER_ROLE = 'role';

    public const APPROVER_USER = 'user';

    public const APPROVER_PERMISSION = 'permission';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'approval_policy_id',
        'level',
        'name',
        'approver_type',
        'approver_value',
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
     * @return BelongsTo<ApprovalPolicy, $this>
     */
    public function policy(): BelongsTo
    {
        return $this->belongsTo(ApprovalPolicy::class, 'approval_policy_id');
    }
}
