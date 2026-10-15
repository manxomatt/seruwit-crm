<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityBlacklist extends Model
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
        'tenant_id',
        'reporting_company_name',
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
        'share_anonymously',
        'is_active',
        'source_blacklist_id',
    ];

    /**
     * Pinned to central connection so tenant context queries hit the central shared database.
     */
    public function getConnectionName(): ?string
    {
        $connection = config('tenancy.database.central_connection');

        if ($connection && config("database.connections.{$connection}")) {
            return $connection;
        }

        return config('database.default');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'incident_date' => 'date:Y-m-d',
            'evidence_urls' => 'array',
            'is_active' => 'boolean',
            'share_anonymously' => 'boolean',
        ];
    }

    /**
     * Scope for active records.
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

    /**
     * Reporting display label.
     */
    public function getReporterDisplayAttribute(): string
    {
        if ($this->share_anonymously || empty($this->reporting_company_name)) {
            return 'Mitra Rental Terverifikasi';
        }

        return $this->reporting_company_name;
    }
}
