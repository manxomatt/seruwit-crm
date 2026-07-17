<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Subscription plans: which modules a tenant may install.
 *
 * Central only. Plans are a platform-wide product definition, not tenant data —
 * a tenant carries just its plan key, as a virtual column on its `data` JSON.
 *
 * The module set is a JSON array rather than a pivot because module keys come
 * from the code registry (config/modules.php), not a table, so there is nothing
 * to reference; keeping the set on the row makes editing a plan one atomic write.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->json('modules');
            $table->integer('sort_order')->default(0);
            // The plan a tenant falls back to when it has none of its own,
            // including every tenant provisioned before plans existed.
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
