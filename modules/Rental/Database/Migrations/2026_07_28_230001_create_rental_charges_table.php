<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_charges', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            // base | extension | excess_km | damage — one billable row per event
            $table->string('kind', 32);
            $table->decimal('amount', 14, 2);
            $table->string('description');
            $table->foreignId('rental_extension_id')->nullable()->constrained('rental_extensions')->nullOnDelete();
            $table->foreignId('rental_damage_id')->nullable()->constrained('rental_damages')->nullOnDelete();
            $table->timestamps();

            $table->index(['rental_id', 'kind']);
            $table->unique('rental_extension_id');
            $table->unique('rental_damage_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_charges');
    }
};
