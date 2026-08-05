<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Partner;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->json('name');
            $table->json('description')->nullable();
            $table->boolean('affects_customer_rank')->default(false);
            $table->boolean('affects_supplier_rank')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('partner_partner_type', function (Blueprint $table) {
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->foreignId('partner_type_id')->constrained('partner_types')->cascadeOnDelete();
            $table->primary(['partner_id', 'partner_type_id']);
        });

        $now = now();
        $types = [
            [
                'code' => 'customer',
                'name' => json_encode(['id' => 'Customer', 'en' => 'Customer']),
                'description' => json_encode(['id' => 'Pihak yang membeli atau menyewa dari kita.', 'en' => 'Party that buys or rents from us.']),
                'affects_customer_rank' => true,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'supplier',
                'name' => json_encode(['id' => 'Supplier', 'en' => 'Supplier']),
                'description' => json_encode(['id' => 'Vendor atau pemasok.', 'en' => 'Vendor or supplier.']),
                'affects_customer_rank' => false,
                'affects_supplier_rank' => true,
            ],
            [
                'code' => 'corporate',
                'name' => json_encode(['id' => 'Korporat', 'en' => 'Corporate']),
                'description' => json_encode(['id' => 'Akun korporat B2B.', 'en' => 'B2B corporate account.']),
                'affects_customer_rank' => true,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'walk_in',
                'name' => json_encode(['id' => 'Walk-in', 'en' => 'Walk-in']),
                'description' => json_encode(['id' => 'Pelanggan tanpa akun tetap.', 'en' => 'Customer without a standing account.']),
                'affects_customer_rank' => true,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'guarantor',
                'name' => json_encode(['id' => 'Penjamin', 'en' => 'Guarantor']),
                'description' => json_encode(['id' => 'Penjamin pada kontrak sewa.', 'en' => 'Guarantor on rental contracts.']),
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'agency',
                'name' => json_encode(['id' => 'Agen', 'en' => 'Agency']),
                'description' => json_encode(['id' => 'Agen atau perantara booking.', 'en' => 'Booking agent or intermediary.']),
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
            [
                'code' => 'insurance',
                'name' => json_encode(['id' => 'Asuransi', 'en' => 'Insurance']),
                'description' => json_encode(['id' => 'Perusahaan asuransi.', 'en' => 'Insurance company.']),
                'affects_customer_rank' => false,
                'affects_supplier_rank' => true,
            ],
            [
                'code' => 'other',
                'name' => json_encode(['id' => 'Lainnya', 'en' => 'Other']),
                'description' => json_encode(['id' => 'Kategori umum.', 'en' => 'General category.']),
                'affects_customer_rank' => false,
                'affects_supplier_rank' => false,
            ],
        ];

        foreach ($types as $type) {
            DB::table('partner_types')->insert([
                ...$type,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $typeIdsByCode = DB::table('partner_types')->pluck('id', 'code');

        if (Schema::hasTable('partners')) {
            Partner::query()->eachById(function (Partner $partner) use ($typeIdsByCode): void {
                $attach = [];

                if ($partner->customer_rank > 0 && isset($typeIdsByCode['customer'])) {
                    $attach[] = $typeIdsByCode['customer'];
                }

                if ($partner->supplier_rank > 0 && isset($typeIdsByCode['supplier'])) {
                    $attach[] = $typeIdsByCode['supplier'];
                }

                if ($attach === [] && $partner->sub_type === 'other' && isset($typeIdsByCode['other'])) {
                    $attach[] = $typeIdsByCode['other'];
                }

                foreach (array_unique($attach) as $typeId) {
                    DB::table('partner_partner_type')->insertOrIgnore([
                        'partner_id' => $partner->id,
                        'partner_type_id' => $typeId,
                    ]);
                }
            });
        }

        if (Schema::hasTable('menus')) {
            DB::table('menus')
                ->where('slug', 'partners')
                ->update(['name' => 'Contacts']);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_partner_type');
        Schema::dropIfExists('partner_types');

        if (Schema::hasTable('menus')) {
            DB::table('menus')
                ->where('slug', 'partners')
                ->update(['name' => 'Partners']);
        }
    }
};
