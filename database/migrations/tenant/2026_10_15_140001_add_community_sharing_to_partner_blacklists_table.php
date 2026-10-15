<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_blacklists', function (Blueprint $table): void {
            if (! Schema::hasColumn('partner_blacklists', 'is_shared_with_community')) {
                $table->boolean('is_shared_with_community')->default(false)->index();
            }
            if (! Schema::hasColumn('partner_blacklists', 'share_anonymously')) {
                $table->boolean('share_anonymously')->default(true);
            }
        });
    }

    public function down(): void
    {
        Schema::table('partner_blacklists', function (Blueprint $table): void {
            if (Schema::hasColumn('partner_blacklists', 'is_shared_with_community')) {
                $table->dropColumn('is_shared_with_community');
            }
            if (Schema::hasColumn('partner_blacklists', 'share_anonymously')) {
                $table->dropColumn('share_anonymously');
            }
        });
    }
};
