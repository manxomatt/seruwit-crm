<?php

namespace Modules\Partners\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerBlacklist extends Model
{
    use HasFactory;

    public const CATEGORY_CAR_THEFT = 'car_theft';

    public const CATEGORY_PAWN_ATTEMPT = 'pawn_attempt';

    public const CATEGORY_BAD_DEBT = 'bad_debt';

    public const CATEGORY_FAKE_IDENTITY = 'fake_identity';

    public const CATEGORY_RECKLESS_DAMAGE = 'reckless_damage';

    public const CATEGORY_OTHER = 'other';

    public const SEVERITY_CRITICAL = 'critical';

    public const SEVERITY_WARNING = 'warning';

    public const SEVERITY_CAUTION = 'caution';

    protected $fillable = [
        'partner_id',
        'id_number',
        'phone',
        'name',
        'license_number',
        'category',
        'severity',
        'incident_date',
        'incident_details',
        'police_report_number',
        'evidence_urls',
        'is_active',
        'reported_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'incident_date' => 'date:Y-m-d',
            'evidence_urls' => 'array',
            'is_active' => 'boolean',
        ];
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
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Scope for active blacklists.
     *
     * @param  Builder<static>  $query
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope matching NIK or phone.
     *
     * @param  Builder<static>  $query
     */
    public function scopeMatchIdentity(Builder $query, ?string $idNumber, ?string $phone): Builder
    {
        return $query->where(function (Builder $sub) use ($idNumber, $phone) {
            $matched = false;
            if (! empty($idNumber)) {
                $sub->where('id_number', trim($idNumber));
                $matched = true;
            }
            if (! empty($phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
                if ($matched) {
                    $sub->orWhere('phone', 'like', "%{$cleanPhone}%");
                } else {
                    $sub->where('phone', 'like', "%{$cleanPhone}%");
                }
            }
        });
    }

    /**
     * Human-readable label for category.
     */
    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_CAR_THEFT => 'Penggelapan Armada',
            self::CATEGORY_PAWN_ATTEMPT => 'Percobaan Gadai Tanpa Izin',
            self::CATEGORY_BAD_DEBT => 'Gagal Bayar / Kabur',
            self::CATEGORY_FAKE_IDENTITY => 'Pemalsuan Dokumen Identitas',
            self::CATEGORY_RECKLESS_DAMAGE => 'Kecelakaan / Rusak Berat Menolak Ganti',
            default => 'Pelanggaran Lainnya',
        };
    }
}
