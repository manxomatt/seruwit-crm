<?php

namespace Modules\Orders\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Orders\Database\Factories\PodPhotoFactory;

class PodPhoto extends Model
{
    /** @use HasFactory<PodPhotoFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return PodPhotoFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $appends = ['url'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'proof_of_delivery_id',
        'path',
    ];

    /**
     * @return BelongsTo<ProofOfDelivery, $this>
     */
    public function proofOfDelivery(): BelongsTo
    {
        return $this->belongsTo(ProofOfDelivery::class);
    }

    /**
     * The photo's URL, served through the tenancy asset route.
     */
    public function getUrlAttribute(): string
    {
        return tenancy()->initialized
            ? route('stancl.tenancy.asset', ['path' => $this->path], false)
            : '/storage/'.$this->path;
    }
}
