<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gateway_charges')) {
            Schema::table('gateway_charges', function (Blueprint $table): void {
                if (! Schema::hasColumn('gateway_charges', 'chargeable_type')) {
                    $table->string('chargeable_type', 150)->nullable()->after('purpose');
                }
                if (! Schema::hasColumn('gateway_charges', 'chargeable_id')) {
                    $table->unsignedBigInteger('chargeable_id')->nullable()->after('chargeable_type');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('gateway_charges')) {
            Schema::table('gateway_charges', function (Blueprint $table): void {
                if (Schema::hasColumn('gateway_charges', 'chargeable_id')) {
                    $table->dropColumn('chargeable_id');
                }
                if (Schema::hasColumn('gateway_charges', 'chargeable_type')) {
                    $table->dropColumn('chargeable_type');
                }
            });
        }
    }
};
