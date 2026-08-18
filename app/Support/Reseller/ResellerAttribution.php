<?php

namespace App\Support\Reseller;

use App\Models\ResellerProfile;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Who gets credit for a tenant that signed itself up.
 *
 * A referral code travels from the landing page to the workspace in a cookie,
 * because the prospect will register and onboard across several requests before
 * a tenant exists to attribute.
 */
class ResellerAttribution
{
    public const COOKIE = 'reseller_ref';

    public const COOKIE_MINUTES = 60 * 24 * 30;

    /**
     * The raw code on this request, from the query string first and the cookie
     * second — a fresh link should beat a stale cookie.
     */
    public static function codeFromRequest(Request $request): ?string
    {
        foreach ([$request->query('ref'), $request->cookie(self::COOKIE)] as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '') {
                return strtoupper(trim($candidate));
            }
        }

        return null;
    }

    /**
     * Turn a code into the reseller it belongs to.
     *
     * An unknown or terminated code resolves to null and is simply ignored:
     * a mistyped link must still let someone sign up, just unattributed.
     */
    public static function resolve(?string $code): ?string
    {
        if ($code === null || trim($code) === '') {
            return null;
        }

        $profile = ResellerProfile::query()
            ->where('referral_code', strtoupper(trim($code)))
            ->first();

        return $profile !== null && $profile->canAccrue()
            ? $profile->reseller_global_id
            : null;
    }

    public static function resolveFromRequest(Request $request): ?string
    {
        return self::resolve(self::codeFromRequest($request));
    }

    /**
     * When this attribution stops earning, or null for a lifetime one.
     */
    public static function endsAt(?Carbon $from = null): ?Carbon
    {
        $months = config('reseller.attribution_months');

        if ($months === null || (int) $months <= 0) {
            return null;
        }

        return ($from ?? now())->copy()->addMonths((int) $months);
    }

    /**
     * Attribute a tenant, first touch wins.
     *
     * A tenant that already belongs to a reseller is never reassigned by a
     * later link — otherwise the last person to send a URL would take credit
     * for someone else's customer.
     */
    public static function apply(Tenant $tenant, ?string $resellerGlobalId): bool
    {
        if ($resellerGlobalId === null || $tenant->reseller_global_id !== null) {
            return false;
        }

        $now = now();

        $tenant->update([
            'reseller_global_id' => $resellerGlobalId,
            'reseller_attributed_at' => $now,
            'reseller_attribution_ends_at' => self::endsAt($now),
        ]);

        return true;
    }
}
