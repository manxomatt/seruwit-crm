<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canvassing_targets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('salesperson_id')->constrained('salespeople')->cascadeOnDelete();
            $table->smallInteger('year');
            $table->tinyInteger('month');
            $table->unsignedInteger('target_visits')->default(0);
            $table->unsignedInteger('target_new_partners')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['salesperson_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canvassing_targets');
    }
};
