<?php

namespace Modules\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Partners\Models\Partner;

class VehicleComplianceRenewal extends Model
{
    public const TYPE_STNK_ANNUAL = 'stnk_annual';

    public const TYPE_STNK_FIVE_YEAR = 'stnk_five_year';

    public const TYPE_INSURANCE = 'insurance';

    public const TYPE_KIR = 'kir';

    public const PAYER_TENANT = 'tenant';

    public const PAYER_OWNER = 'owner';

    public const PAYER_SHARED = 'shared';

    protected $fillable = [
        'vehicle_id',
        'document_type',
        'previous_expires_at',
        'new_expires_at',
        'renewal_date',
        'cost',
        'payer',
        'partner_id',
        'reference_number',
        'notes',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'previous_expires_at' => 'date:Y-m-d',
            'new_expires_at' => 'date:Y-m-d',
            'renewal_date' => 'date:Y-m-d',
            'cost' => 'decimal:2',
            'created_by' => 'integer',
            'partner_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
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
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
