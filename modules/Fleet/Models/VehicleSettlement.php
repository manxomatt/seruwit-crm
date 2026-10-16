<?php

namespace Modules\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Partners\Models\Partner;

class VehicleSettlement extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'vehicle_id',
        'partner_id',
        'period_month',
        'start_date',
        'end_date',
        'ownership_type',
        'settlement_scheme',
        'revenue_share_owner_pct',
        'revenue_share_tenant_pct',
        'fixed_fee_amount',
        'maintenance_payer',
        'total_orders',
        'total_rental_days',
        'total_revenue',
        'owner_gross_share',
        'tenant_gross_share',
        'total_maintenance_cost',
        'maintenance_deduction',
        'other_adjustment',
        'adjustment_notes',
        'net_payout',
        'status',
        'payment_method',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
        'payment_reference',
        'approved_at',
        'paid_at',
        'approved_by',
        'paid_by',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'vehicle_id' => 'integer',
            'partner_id' => 'integer',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'revenue_share_owner_pct' => 'decimal:2',
            'revenue_share_tenant_pct' => 'decimal:2',
            'fixed_fee_amount' => 'decimal:2',
            'total_orders' => 'integer',
            'total_rental_days' => 'integer',
            'total_revenue' => 'decimal:2',
            'owner_gross_share' => 'decimal:2',
            'tenant_gross_share' => 'decimal:2',
            'total_maintenance_cost' => 'decimal:2',
            'maintenance_deduction' => 'decimal:2',
            'other_adjustment' => 'decimal:2',
            'net_payout' => 'decimal:2',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
            'approved_by' => 'integer',
            'paid_by' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    /**
     * Generate a unique settlement reference code for a given period and vehicle.
     */
    public static function generateCode(string $periodMonth, int $vehicleId): string
    {
        $cleanMonth = str_replace('-', '', $periodMonth);
        $suffix = str_pad((string) $vehicleId, 4, '0', STR_PAD_LEFT);

        return "STL-{$cleanMonth}-{$suffix}";
    }
}
