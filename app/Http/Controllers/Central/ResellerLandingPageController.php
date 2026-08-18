<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\ResellerProfile;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public, no-login page a reseller shares to pitch the platform under
 * their own referral code.
 *
 * Deliberately unauthenticated and unscoped by anything but the code in the
 * URL — this page's whole purpose is to be shared with strangers.
 */
class ResellerLandingPageController extends Controller
{
    public function show(string $code): Response
    {
        $profile = ResellerProfile::query()
            ->where('referral_code', strtoupper($code))
            ->first();

        // A disabled, empty, or unknown code renders the same 404 rather than
        // leaking which codes exist versus which are merely turned off.
        abort_unless($profile !== null && $profile->hasLandingPage(), 404);

        return Inertia::render('Reseller/LandingPage', [
            'referralCode' => $profile->referral_code,
            'companyName' => $profile->company_name,
            'headline' => $profile->landing_headline,
            'subheadline' => $profile->landing_subheadline,
            'ctaText' => $profile->landing_cta_text ?: __('reseller.landing.default_cta'),
            'highlights' => $profile->landing_highlights ?? [],
        ]);
    }
}
