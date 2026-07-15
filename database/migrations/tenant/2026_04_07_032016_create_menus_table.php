<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Display name
            $table->string('slug')->unique(); // Unique identifier
            $table->string('icon')->nullable(); // Icon name/class
            $table->string('route_name')->nullable(); // Laravel route name (e.g., 'pages.index')
            $table->string('url')->nullable(); // Custom URL if not using route
            $table->foreignId('parent_id')->nullable()->constrained('menus')->onDelete('cascade');
            $table->string('permission_module')->nullable(); // Module name from permissions table
            $table->string('permission_action')->default('view'); // Action required (view, create, etc.)
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('target')->default('_self'); // _self, _blank
            $table->timestamps();

            $table->index(['parent_id', 'sort_order']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
