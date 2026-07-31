<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_industries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('partner_titles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('short_name');
            $table->timestamps();
        });

        Schema::create('partner_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('color')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('partner_partner_tag', function (Blueprint $table) {
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained('partner_tags')->cascadeOnDelete();
            $table->primary(['partner_id', 'tag_id']);
        });

        Schema::create('partner_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->string('type')->default('shipping');
            $table->string('label')->nullable();
            $table->string('street')->nullable();
            $table->string('street2')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('zip')->nullable();
            $table->string('country')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['partner_id', 'type']);
        });

        Schema::create('partner_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->string('bank_name');
            $table->string('account_number');
            $table->string('account_holder_name');
            $table->boolean('is_active')->default(true);
            $table->boolean('can_send_money')->default(false);
            $table->timestamps();

            $table->unique(['bank_name', 'account_number']);
        });

        // Add FK for industry_id and title_id now that tables exist
        Schema::table('partners', function (Blueprint $table) {
            $table->foreign('industry_id')->references('id')->on('partner_industries')->nullOnDelete();
            $table->foreign('title_id')->references('id')->on('partner_titles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropForeign(['industry_id']);
            $table->dropForeign(['title_id']);
        });

        Schema::dropIfExists('partner_bank_accounts');
        Schema::dropIfExists('partner_addresses');
        Schema::dropIfExists('partner_partner_tag');
        Schema::dropIfExists('partner_tags');
        Schema::dropIfExists('partner_titles');
        Schema::dropIfExists('partner_industries');
    }
};
