<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canvassing_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('salesperson_id')->constrained('salespeople')->cascadeOnDelete();
            $table->date('plan_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['planned', 'completed', 'cancelled'])->default('planned');
            $table->timestamps();

            $table->index(['salesperson_id', 'plan_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canvassing_plans');
    }
};
