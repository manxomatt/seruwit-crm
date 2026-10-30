<?php

namespace Modules\RentalCorporate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;

class RentalCorporateContract extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_TERMINATED = 'terminated';

    public const BILLING_MONTHLY = 'monthly';

    public const BILLING_BIWEEKLY = 'biweekly';

    public const BILLING_PER_TRIP = 'per_trip';

    protected $table = 'rental_corporate_contracts';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'partner_id',
        'title',
        'po_number',
        'pic_name',
        'pic_phone',
        'pic_email',
        'start_date',
        'end_date',
        'billing_cycle',
        'payment_term_days',
        'credit_limit',
        'discount_pct',
        'tax_included',
        'withholding_tax_pct',
        'sla_replacement_hours',
        'includes_maintenance',
        'includes_insurance',
        'includes_driver',
        'status',
        'notes',
        'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'payment_term_days' => 'integer',
            'credit_limit' => 'decimal:2',
            'discount_pct' => 'decimal:2',
            'tax_included' => 'boolean',
            'withholding_tax_pct' => 'decimal:2',
            'sla_replacement_hours' => 'integer',
            'includes_maintenance' => 'boolean',
            'includes_insurance' => 'boolean',
            'includes_driver' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return HasMany<Rental, $this> */
    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class, 'corporate_contract_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Auto-generate a unique corporate contract code.
     */
    public static function generateCode(): string
    {
        $prefix = 'B2B-'.now()->format('Ym');
        $latest = static::query()
            ->where('code', 'like', "{$prefix}-%")
            ->latest('id')
            ->first();

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest->code, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }
}
