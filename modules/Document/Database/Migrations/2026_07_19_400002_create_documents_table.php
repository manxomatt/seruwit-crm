<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            // RESTRICT: don't delete a type that still has documents.
            $table->foreignId('document_type_id')->constrained('document_types');
            // Polymorphic target: 'vehicle' → Vehicle, 'driver' → Driver
            // (morph map registered in DocumentModule::boot)
            $table->morphs('documentable');
            $table->string('document_number')->nullable();
            $table->date('issued_at')->nullable();
            // null = document has no expiry (has_expiry = false on its type)
            $table->date('expires_at')->nullable()->index();
            $table->text('notes')->nullable();
            // nullOnDelete: the scan file can be deleted from the media library
            // independently; losing the file doesn't invalidate the record.
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            // RESTRICT: don't delete a user who has uploaded compliance documents.
            $table->foreignId('uploaded_by')->constrained('users');
            // nullOnDelete: verifier may leave the company; record survives.
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            // Soft delete = "superseded": uploading a renewal soft-deletes the
            // old row so it stays as auditable history without affecting status.
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
