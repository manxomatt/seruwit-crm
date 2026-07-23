<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Partners\Database\Factories\PartnerBankAccountFactory;

class PartnerBankAccount extends Model
{
    /** @use HasFactory<PartnerBankAccountFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return PartnerBankAccountFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'bank_name',
        'account_number',
        'account_holder_name',
        'is_active',
        'can_send_money',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'can_send_money' => 'boolean',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
