<?php

namespace Modules\Orders\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Orders\Database\Factories\ProofOfDeliveryFactory;
use Modules\TransportationManagement\Models\TripStop;

/**
 * The record captured when a driver hands a delivery order over: who received
 * it, their signature, evidence photos, the per-item outcome, and where/when.
 */
class ProofOfDelivery extends Model
{
    /** @use HasFactory<ProofOfDeliveryFactory> */
    use HasFactory;

    protected $table = 'proof_of_deliveries';

    /**
     * @var list<string>
     */
    protected $appends = ['signature_url'];

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return ProofOfDeliveryFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'delivery_order_id',
        'trip_stop_id',
        'recipient_name',
        'signature_path',
        'notes',
        'latitude',
        'longitude',
        'delivered_at',
        'submitted_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'delivered_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<DeliveryOrder, $this>
     */
    public function deliveryOrder(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class);
    }

    /**
     * @return HasMany<PodPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(PodPhoto::class);
    }

    /**
     * @return HasMany<PodItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PodItem::class);
    }

    /**
     * @return BelongsTo<TripStop, $this>
     */
    public function tripStop(): BelongsTo
    {
        return $this->belongsTo(TripStop::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * The signature's URL, served through the tenancy asset route (tenant files
     * live in per-tenant storage without a public symlink). Same shape as
     * App\Models\Media::getUrlAttribute().
     */
    public function getSignatureUrlAttribute(): ?string
    {
        if ($this->signature_path === null) {
            return null;
        }

        return tenancy()->initialized
            ? route('stancl.tenancy.asset', ['path' => $this->signature_path], false)
            : '/storage/'.$this->signature_path;
    }
}
