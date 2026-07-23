<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('products', 'category')) {
            DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check');
            DB::statement("ALTER TABLE products ADD CONSTRAINT products_category_check CHECK (category::text = ANY (ARRAY['merchandise'::text, 'fleet_sparepart'::text, 'service'::text]))");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'category')) {
            DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check');
            DB::statement("ALTER TABLE products ADD CONSTRAINT products_category_check CHECK (category::text = ANY (ARRAY['merchandise'::text, 'fleet_sparepart'::text]))");
        }
    }
};
