<?php

namespace Modules\Partners\Services;

use Modules\Partners\Models\CommunityBlacklist;
use Modules\Partners\Models\PartnerBlacklist;

class CommunityBlacklistSyncService
{
    /**
     * Synchronize a tenant PartnerBlacklist record to the central CommunityBlacklist registry.
     */
    public function sync(PartnerBlacklist $blacklist): ?CommunityBlacklist
    {
        $tenantId = function_exists('tenant') && tenant() ? (string) tenant('id') : 'default';
        $tenantName = function_exists('tenant') && tenant() ? (string) (tenant('name') ?: 'Mitra Rental') : 'Mitra Rental';

        if ($blacklist->is_shared_with_community && $blacklist->is_active) {
            $companyDisplay = $blacklist->share_anonymously ? 'Mitra Rental Terverifikasi' : $tenantName;

            /** @var CommunityBlacklist $community */
            $community = CommunityBlacklist::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'source_blacklist_id' => $blacklist->id,
                ],
                [
                    'reporting_company_name' => $companyDisplay,
                    'id_number' => $blacklist->id_number,
                    'phone' => $blacklist->phone,
                    'name' => $blacklist->name,
                    'license_number' => $blacklist->license_number,
                    'category' => $blacklist->category,
                    'severity' => $blacklist->severity,
                    'incident_date' => $blacklist->incident_date,
                    'incident_details' => $blacklist->incident_details,
                    'police_report_number' => $blacklist->police_report_number,
                    'evidence_urls' => $blacklist->evidence_urls,
                    'share_anonymously' => (bool) $blacklist->share_anonymously,
                    'is_active' => true,
                ]
            );

            return $community;
        }

        // If not shared or not active, deactivate any existing central record
        CommunityBlacklist::query()
            ->where('tenant_id', $tenantId)
            ->where('source_blacklist_id', $blacklist->id)
            ->update(['is_active' => false]);

        return null;
    }

    /**
     * Remove or delete central record when local blacklist is destroyed.
     */
    public function delete(PartnerBlacklist $blacklist): void
    {
        $tenantId = function_exists('tenant') && tenant() ? (string) tenant('id') : 'default';

        CommunityBlacklist::query()
            ->where('tenant_id', $tenantId)
            ->where('source_blacklist_id', $blacklist->id)
            ->delete();
    }
}
