<?php

namespace Modules\Approvals\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalPolicy extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'name',
        'trigger_type',
        'is_active',
        'conditions',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'conditions' => 'array',
        ];
    }

    /**
     * @return HasMany<ApprovalPolicyLevel, $this>
     */
    public function levels(): HasMany
    {
        return $this->hasMany(ApprovalPolicyLevel::class)->orderBy('level');
    }

    /**
     * @return HasMany<ApprovalRequest, $this>
     */
    public function requests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
    }
}
