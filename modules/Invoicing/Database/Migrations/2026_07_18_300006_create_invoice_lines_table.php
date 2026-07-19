<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_lines', function (Blueprint $table) {
            $table->id();
            // Cascade: a line has no meaning without its invoice, and deleting a
            // draft invoice is exactly how its work is released for re-invoicing.
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 12, 2);

            // What this line was raised for, when the billing module has
            // something concrete to point back at — a delivery order's charge
            // today, a travel booking later. No foreign key: the target lives in
            // whichever module raised the line, and Invoicing must stay ignorant
            // of all of them. Nullable so a free-form line needs no source.
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();

            $table->timestamps();

            // Doubles as the lookup index for "has this charge been billed yet?"
            // and as the guarantee that it can never be billed onto two invoices.
            // Postgres treats NULLs as distinct, so free-form lines are unaffected.
            $table->unique(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_lines');
    }
};
