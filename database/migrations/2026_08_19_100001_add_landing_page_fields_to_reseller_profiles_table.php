<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A minimal, self-serve marketing page per reseller at /r/{referral_code}.
 *
 * Text-only on purpose: no logo/image upload, no rich editor. It reuses the
 * platform's own landing template shell (see resources/js/Pages/Reseller/
 * LandingPage.tsx) with just enough fields to make the pitch personal —
 * anything heavier belongs in the full Pages/GrapesJS builder, which is a
 * different (tenant-scoped) product entirely.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reseller_profiles', function (Blueprint $table): void {
            $table->boolean('landing_is_enabled')->default(false)->after('notes');
            $table->string('landing_headline')->nullable()->after('landing_is_enabled');
            $table->string('landing_subheadline')->nullable()->after('landing_headline');
            $table->string('landing_cta_text')->nullable()->after('landing_subheadline');
            $table->json('landing_highlights')->nullable()->after('landing_cta_text');
        });
    }

    public function down(): void
    {
        Schema::table('reseller_profiles', function (Blueprint $table): void {
            $table->dropColumn([
                'landing_is_enabled',
                'landing_headline',
                'landing_subheadline',
                'landing_cta_text',
                'landing_highlights',
            ]);
        });
    }
};
