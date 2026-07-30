<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->json('checkout_photos')->nullable()->after('checkout_notes');
            $table->string('checkout_signature_path')->nullable()->after('checkout_photos');
            $table->timestamp('checkout_signed_at')->nullable()->after('checkout_signature_path');
            $table->json('return_photos')->nullable()->after('return_notes');
            $table->string('return_signature_path')->nullable()->after('return_photos');
            $table->timestamp('return_signed_at')->nullable()->after('return_signature_path');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn([
                'checkout_photos',
                'checkout_signature_path',
                'checkout_signed_at',
                'return_photos',
                'return_signature_path',
                'return_signed_at',
            ]);
        });
    }
};
