<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_bays', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('work_orders', function (Blueprint $table) {
            $table->foreignId('bay_id')->nullable()->after('mechanic_user_id')->constrained('maintenance_bays')->nullOnDelete();
            $table->decimal('estimated_hours', 8, 2)->nullable()->after('bay_id');
            $table->decimal('actual_hours', 8, 2)->nullable()->after('estimated_hours');
            $table->boolean('waiting_parts')->default(false)->after('actual_hours');
        });
    }

    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bay_id');
            $table->dropColumn(['estimated_hours', 'actual_hours', 'waiting_parts']);
        });

        Schema::dropIfExists('maintenance_bays');
    }
};
