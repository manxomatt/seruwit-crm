<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_extension_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            $table->date('requested_end_date');
            $table->unsignedInteger('estimated_periods')->default(0);
            $table->decimal('estimated_amount', 14, 2)->default(0);
            $table->string('status', 32)->default('pending');
            $table->string('channel', 16)->default('web');
            $table->text('notes')->nullable();
            $table->text('staff_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['rental_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_extension_requests');
    }
};
