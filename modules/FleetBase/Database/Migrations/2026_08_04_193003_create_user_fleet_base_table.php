<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_fleet_base', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('fleet_base_id')->constrained('fleet_bases')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'fleet_base_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_fleet_base');
    }
};
