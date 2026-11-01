<?php

namespace Modules\Collections\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;

class CollectionDunning extends Model
{
    use HasFactory;

    public const STAGE_REMINDER_H3 = 'reminder_h3';

    public const STAGE_DUE_H0 = 'due_h0';

    public const STAGE_OVERDUE_H7 = 'overdue_h7';

    public const STAGE_OVERDUE_H14 = 'overdue_h14';

    public const STAGE_OVERDUE_H30 = 'overdue_h30';

    public const STAGE_FINAL_NOTICE = 'final_notice';

    public const STATUS_QUEUED = 'queued';

    public const STATUS_SENT = 'sent';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_FAILED = 'failed';

    protected $table = 'collection_dunnings';

    protected $fillable = [
        'invoice_id',
        'partner_id',
        'stage',
        'channel',
        'recipient',
        'status',
        'message_body',
        'sent_at',
        'sent_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
