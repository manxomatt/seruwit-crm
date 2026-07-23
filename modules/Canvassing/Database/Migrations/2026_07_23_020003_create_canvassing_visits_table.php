<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canvassing_visits', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('salesperson_id')->constrained('salespeople')->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained('partners')->restrictOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained('canvassing_plans')->nullOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('checked_in_at');
            $table->datetime('checked_out_at')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->enum('outcome', ['pending', 'contacted', 'no_contact', 'interested', 'not_interested', 'callback'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['salesperson_id', 'checked_in_at']);
            $table->index('partner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canvassing_visits');
    }
};
