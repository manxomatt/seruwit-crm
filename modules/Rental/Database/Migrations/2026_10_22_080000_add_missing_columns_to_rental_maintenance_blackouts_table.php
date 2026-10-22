<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('rental_maintenance_blackouts')) {
            return;
        }

        Schema::table('rental_maintenance_blackouts', function (Blueprint $table) {
            if (! Schema::hasColumn('rental_maintenance_blackouts', 'type')) {
                $table->string('type', 40)->default('preventive_service')->after('code');
            }
            if (! Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
                $table->boolean('prevent_rentals')->default(true)->after('status');
            }
            if (! Schema::hasColumn('rental_maintenance_blackouts', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('created_by');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('rental_maintenance_blackouts')) {
            return;
        }

        Schema::table('rental_maintenance_blackouts', function (Blueprint $table) {
            $drops = [];
            if (Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
                $drops[] = 'prevent_rentals';
            }
            if (Schema::hasColumn('rental_maintenance_blackouts', 'type')) {
                $drops[] = 'type';
            }
            if (Schema::hasColumn('rental_maintenance_blackouts', 'completed_at')) {
                $drops[] = 'completed_at';
            }
            if (! empty($drops)) {
                $table->dropColumn($drops);
            }
        });
    }
};
