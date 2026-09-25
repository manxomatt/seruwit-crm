<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->boolean('is_custom')->default(false)->after('domain');
            $table->boolean('is_primary')->default(false)->after('is_custom');
            $table->string('status', 30)->default('active')->after('is_primary');
            $table->string('verification_token', 64)->nullable()->after('status');
            $table->string('cloudflare_hostname_id', 100)->nullable()->after('verification_token');
            $table->string('cloudflare_status', 50)->nullable()->after('cloudflare_hostname_id');
            $table->string('cloudflare_ssl_status', 50)->nullable()->after('cloudflare_status');
            $table->timestamp('verified_at')->nullable()->after('cloudflare_ssl_status');
            $table->timestamp('last_checked_at')->nullable()->after('verified_at');
            $table->text('last_error')->nullable()->after('last_checked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn([
                'is_custom',
                'is_primary',
                'status',
                'verification_token',
                'cloudflare_hostname_id',
                'cloudflare_status',
                'cloudflare_ssl_status',
                'verified_at',
                'last_checked_at',
                'last_error',
            ]);
        });
    }
};
