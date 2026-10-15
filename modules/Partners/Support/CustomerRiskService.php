<?php

namespace Modules\Partners\Support;

use Modules\Partners\Models\CommunityBlacklist;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBlacklist;

class CustomerRiskService
{
    /**
     * Evaluate customer identity against blacklist registry (both local and cross-tenant community).
     *
     * @return array{
     *     risk_level: 'clean'|'warning'|'blocked',
     *     is_blacklisted: bool,
     *     summary: string,
     *     recommendation: string,
     *     records: list<array<string, mixed>>
     * }
     */
    public function evaluate(?string $idNumber, ?string $phone, ?string $name = null, ?int $partnerId = null): array
    {
        $idNumber = ! empty($idNumber) ? trim($idNumber) : null;
        $cleanPhone = ! empty($phone) ? preg_replace('/[^0-9]/', '', $phone) : null;

        // Query active local blacklist entries
        $query = PartnerBlacklist::query()->active();

        $query->where(function ($q) use ($idNumber, $cleanPhone, $partnerId) {
            $hasCondition = false;
            if ($idNumber) {
                $q->where('id_number', $idNumber);
                $hasCondition = true;
            }
            if ($cleanPhone) {
                if ($hasCondition) {
                    $q->orWhere('phone', 'like', "%{$cleanPhone}%");
                } else {
                    $q->where('phone', 'like', "%{$cleanPhone}%");
                    $hasCondition = true;
                }
            }
            if ($partnerId) {
                if ($hasCondition) {
                    $q->orWhere('partner_id', $partnerId);
                } else {
                    $q->where('partner_id', $partnerId);
                    $hasCondition = true;
                }
            }
            if (! $hasCondition) {
                $q->whereRaw('1 = 0');
            }
        });

        $matchedBlacklists = $query->with('reporter:id,name')->get();

        // Also check Partner model if partnerId is passed
        $partnerBlacklisted = false;
        $partnerReason = null;
        if ($partnerId) {
            $partner = Partner::find($partnerId);
            if ($partner && $partner->is_blacklisted) {
                $partnerBlacklisted = true;
                $partnerReason = $partner->blacklist_reason;
            }
        }

        $records = [];
        $hasCritical = false;
        $hasWarning = false;

        foreach ($matchedBlacklists as $bl) {
            if ($bl->severity === PartnerBlacklist::SEVERITY_CRITICAL) {
                $hasCritical = true;
            } else {
                $hasWarning = true;
            }

            $records[] = [
                'id' => $bl->id,
                'source' => 'local',
                'name' => $bl->name,
                'id_number' => $bl->id_number,
                'phone' => $bl->phone,
                'category' => $bl->category,
                'category_label' => $bl->category_label,
                'severity' => $bl->severity,
                'incident_date' => $bl->incident_date?->toDateString(),
                'incident_details' => $bl->incident_details,
                'police_report_number' => $bl->police_report_number,
                'reported_by_name' => $bl->reporter?->name ?? 'Internal Rental',
                'is_community' => false,
            ];
        }

        // Query active community cross-tenant blacklist
        $currentTenantId = function_exists('tenant') && tenant() ? (string) tenant('id') : null;
        $communityMatches = collect();
        if ($idNumber || $cleanPhone) {
            $commQuery = CommunityBlacklist::query()->active()->matchIdentity($idNumber, $cleanPhone);
            if ($currentTenantId) {
                $commQuery->where(function ($q) use ($currentTenantId) {
                    $q->whereNull('tenant_id')
                        ->orWhere('tenant_id', '!=', $currentTenantId);
                });
            }
            $communityMatches = $commQuery->get();
        }

        $hasCommunityCritical = false;
        foreach ($communityMatches as $cbl) {
            if ($cbl->severity === CommunityBlacklist::SEVERITY_CRITICAL) {
                $hasCritical = true;
                $hasCommunityCritical = true;
            } else {
                $hasWarning = true;
            }

            $records[] = [
                'id' => $cbl->id,
                'source' => 'community',
                'name' => $cbl->name,
                'id_number' => $cbl->id_number,
                'phone' => $cbl->phone,
                'category' => $cbl->category,
                'category_label' => $cbl->category_label,
                'severity' => $cbl->severity,
                'incident_date' => $cbl->incident_date?->toDateString(),
                'incident_details' => $cbl->incident_details,
                'police_report_number' => $cbl->police_report_number,
                'reported_by_name' => $cbl->reporter_display,
                'is_community' => true,
            ];
        }

        if ($partnerBlacklisted && empty($records)) {
            $hasCritical = true;
            $records[] = [
                'id' => null,
                'source' => 'partner_profile',
                'name' => $name ?? 'Data Mitra',
                'id_number' => $idNumber ?? '—',
                'phone' => $phone ?? '—',
                'category' => 'other',
                'category_label' => 'Daftar Hitam Profil Mitra',
                'severity' => PartnerBlacklist::SEVERITY_CRITICAL,
                'incident_date' => null,
                'incident_details' => $partnerReason ?: 'Ditandai blacklist pada data kontak/mitra.',
                'police_report_number' => null,
                'reported_by_name' => 'Sistem',
                'is_community' => false,
            ];
        }

        if ($hasCritical) {
            $summary = $hasCommunityCritical && $matchedBlacklists->isEmpty()
                ? 'PERINGATAN JARINGAN KOMUNITAS: NIK / No. HP ini dilaporkan oleh mitra rental lain dalam Jaringan Anti-Penggelapan Seruwit!'
                : 'PELANGGAN MASUK DAFTAR HITAM (RISIKO TINGGI). Terindikasi kasus pelanggaran berat / penggelapan armada.';

            $recommendation = $hasCommunityCritical && $matchedBlacklists->isEmpty()
                ? 'TOLAK RESERVASI / JANGAN SERAHKAN KENDARAAN. Pelaku terindikasi modus penggelapan pada rental lain.'
                : 'TOLAK RESERVASI / JANGAN SERAHKAN KENDARAAN.';

            return [
                'risk_level' => 'blocked',
                'is_blacklisted' => true,
                'summary' => $summary,
                'recommendation' => $recommendation,
                'records' => $records,
            ];
        }

        if ($hasWarning) {
            return [
                'risk_level' => 'warning',
                'is_blacklisted' => true,
                'summary' => 'PERINGATAN: Pelanggan memiliki catatan sengketa atau peringatan di masa lalu.',
                'recommendation' => 'Waspada: Verifikasi ulang KTP fisik & kenakan syarat jaminan deposit tambahan.',
                'records' => $records,
            ];
        }

        return [
            'risk_level' => 'clean',
            'is_blacklisted' => false,
            'summary' => 'Identitas bersih. Tidak ditemukan catatan daftar hitam internal maupun komunitas.',
            'recommendation' => 'Pelanggan memenuhi syarat sewa.',
            'records' => [],
        ];
    }
}
