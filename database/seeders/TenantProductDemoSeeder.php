<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductAttribute;
use Modules\Product\Models\ProductAttributeValue;
use Modules\Product\Models\ProductCombination;
use Modules\Product\Models\ProductTag;
use Modules\Product\Models\ProductType;

/**
 * Seeds 40 demo products with attribute-driven variants (child SKUs + combinations).
 *
 *   php artisan tenants:seed --class=TenantProductDemoSeeder --tenants={id}
 */
class TenantProductDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! class_exists(Product::class) || ! Schema::hasTable('products')) {
            $this->command?->warn('products table missing. Install the products module first.');

            return;
        }

        $this->cleanup();

        // ── Product Types (hierarchical) ─────────────────────────────────
        $makanan = ProductType::query()->create(['name' => 'Makanan', 'sort_order' => 0]);
        $miInstan = ProductType::query()->create(['name' => 'Mi Instan', 'parent_id' => $makanan->id, 'sort_order' => 1]);
        $snack = ProductType::query()->create(['name' => 'Snack & Biskuit', 'parent_id' => $makanan->id, 'sort_order' => 2]);
        $bumbu = ProductType::query()->create(['name' => 'Bumbu & Saus', 'parent_id' => $makanan->id, 'sort_order' => 3]);
        $sereal = ProductType::query()->create(['name' => 'Sereal & Sarapan', 'parent_id' => $makanan->id, 'sort_order' => 4]);

        $minuman = ProductType::query()->create(['name' => 'Minuman', 'sort_order' => 5]);
        $minumanKemasan = ProductType::query()->create(['name' => 'Minuman Kemasan', 'parent_id' => $minuman->id, 'sort_order' => 6]);
        $kopi = ProductType::query()->create(['name' => 'Kopi & Teh', 'parent_id' => $minuman->id, 'sort_order' => 7]);
        $susu = ProductType::query()->create(['name' => 'Susu & Olahan', 'parent_id' => $minuman->id, 'sort_order' => 8]);

        $perawatan = ProductType::query()->create(['name' => 'Perawatan Tubuh', 'sort_order' => 9]);
        $sabun = ProductType::query()->create(['name' => 'Sabun & Body Care', 'parent_id' => $perawatan->id, 'sort_order' => 10]);
        $rambut = ProductType::query()->create(['name' => 'Perawatan Rambut', 'parent_id' => $perawatan->id, 'sort_order' => 11]);

        $rumahtangga = ProductType::query()->create(['name' => 'Perawatan Rumah', 'sort_order' => 12]);
        $deterjen = ProductType::query()->create(['name' => 'Deterjen & Pembersih', 'parent_id' => $rumahtangga->id, 'sort_order' => 13]);

        $jasa = ProductType::query()->create(['name' => 'Jasa', 'sort_order' => 14]);
        $jasaLogistik = ProductType::query()->create(['name' => 'Jasa Logistik', 'parent_id' => $jasa->id, 'sort_order' => 15]);
        $jasaLainnya = ProductType::query()->create(['name' => 'Jasa Lainnya', 'parent_id' => $jasa->id, 'sort_order' => 16]);

        // ── Tags ─────────────────────────────────────────────────────────
        $tagBestSeller = ProductTag::query()->create(['name' => 'Best Seller', 'color' => 'red']);
        $tagNew = ProductTag::query()->create(['name' => 'Produk Baru', 'color' => 'green']);
        $tagPromo = ProductTag::query()->create(['name' => 'Promo', 'color' => 'orange']);
        $tagHalal = ProductTag::query()->create(['name' => 'Halal', 'color' => 'blue']);
        $tagOrganic = ProductTag::query()->create(['name' => 'Organic', 'color' => 'green']);
        $tagPremium = ProductTag::query()->create(['name' => 'Premium', 'color' => 'purple']);
        $tagEkonomi = ProductTag::query()->create(['name' => 'Ekonomi', 'color' => 'gray']);
        $tagBundle = ProductTag::query()->create(['name' => 'Bundle Pack', 'color' => 'pink']);

        // ── Attributes ───────────────────────────────────────────────────
        $attrUkuran = ProductAttribute::query()->create(['name' => 'Ukuran', 'type' => 'select', 'sort' => 0]);
        $attrUkuran->options()->createMany([
            ['name' => 'Sachet', 'sort' => 0],
            ['name' => 'Small (100-250g)', 'sort' => 1],
            ['name' => 'Medium (250-500g)', 'sort' => 2],
            ['name' => 'Large (500g-1kg)', 'sort' => 3],
            ['name' => 'Jumbo (>1kg)', 'sort' => 4],
        ]);

        $attrRasa = ProductAttribute::query()->create(['name' => 'Rasa', 'type' => 'select', 'sort' => 1]);
        $attrRasa->options()->createMany([
            ['name' => 'Original', 'sort' => 0],
            ['name' => 'Ayam Bawang', 'sort' => 1],
            ['name' => 'Goreng', 'sort' => 2],
            ['name' => 'Soto', 'sort' => 3],
            ['name' => 'Kari Ayam', 'sort' => 4],
            ['name' => 'Rendang', 'sort' => 5],
            ['name' => 'Pedas', 'sort' => 6],
        ]);

        $attrWarna = ProductAttribute::query()->create(['name' => 'Warna', 'type' => 'color', 'sort' => 2]);
        $attrWarna->options()->createMany([
            ['name' => 'Hitam', 'color' => '#000000', 'sort' => 0],
            ['name' => 'Putih', 'color' => '#FFFFFF', 'sort' => 1],
            ['name' => 'Merah', 'color' => '#EF4444', 'sort' => 2],
            ['name' => 'Biru', 'color' => '#3B82F6', 'sort' => 3],
            ['name' => 'Hijau', 'color' => '#22C55E', 'sort' => 4],
            ['name' => 'Pink', 'color' => '#EC4899', 'sort' => 5],
        ]);

        $attrAroma = ProductAttribute::query()->create(['name' => 'Aroma', 'type' => 'radio', 'sort' => 3]);
        $attrAroma->options()->createMany([
            ['name' => 'Lavender', 'sort' => 0],
            ['name' => 'Lemon', 'sort' => 1],
            ['name' => 'Rose', 'sort' => 2],
            ['name' => 'Fresh', 'sort' => 3],
            ['name' => 'Ocean Breeze', 'sort' => 4],
        ]);

        $attrKemasan = ProductAttribute::query()->create(['name' => 'Jenis Kemasan', 'type' => 'select', 'sort' => 4]);
        $attrKemasan->options()->createMany([
            ['name' => 'Botol Plastik', 'sort' => 0],
            ['name' => 'Botol Kaca', 'sort' => 1],
            ['name' => 'Pouch', 'sort' => 2],
            ['name' => 'Tetra Pak', 'sort' => 3],
            ['name' => 'Kaleng', 'sort' => 4],
            ['name' => 'Dus', 'sort' => 5],
        ]);

        $attrUkuran->load('options');
        $attrRasa->load('options');
        $attrWarna->load('options');
        $attrAroma->load('options');
        $attrKemasan->load('options');

        // ── Principal 1: PT Indofood CBP ─────────────────────────────────
        $p1 = Principal::query()->create([
            'code' => 'PRC-000001',
            'name' => 'PT Indofood CBP Sukses Makmur',
            'contact_person' => 'Budi Hartono',
            'phone' => '021-5795-8822',
            'email' => 'distribution@indofood.co.id',
            'address' => 'Sudirman Plaza, Jl. Jend. Sudirman Kav. 76-78, Jakarta Selatan',
            'status' => 'active',
        ]);
        $b1a = Brand::query()->create(['principal_id' => $p1->id, 'name' => 'Indomie', 'status' => 'active']);
        $b1b = Brand::query()->create(['principal_id' => $p1->id, 'name' => 'Pop Mie', 'status' => 'active']);
        $b1c = Brand::query()->create(['principal_id' => $p1->id, 'name' => 'Chitato', 'status' => 'active']);
        $b1d = Brand::query()->create(['principal_id' => $p1->id, 'name' => 'Bimoli', 'status' => 'active']);
        $b1e = Brand::query()->create(['principal_id' => $p1->id, 'name' => 'Indofood Bumbu', 'status' => 'active']);

        // ── Principal 2: PT Unilever Indonesia ───────────────────────────
        $p2 = Principal::query()->create([
            'code' => 'PRC-000002',
            'name' => 'PT Unilever Indonesia',
            'contact_person' => 'Sari Dewi',
            'phone' => '021-526-2112',
            'email' => 'distribution@unilever.co.id',
            'address' => 'Grha Unilever, BSD Green Office Park, Tangerang Selatan',
            'status' => 'active',
        ]);
        $b2a = Brand::query()->create(['principal_id' => $p2->id, 'name' => 'Rinso', 'status' => 'active']);
        $b2b = Brand::query()->create(['principal_id' => $p2->id, 'name' => 'Sunsilk', 'status' => 'active']);
        $b2c = Brand::query()->create(['principal_id' => $p2->id, 'name' => 'Dove', 'status' => 'active']);
        $b2d = Brand::query()->create(['principal_id' => $p2->id, 'name' => 'Bango', 'status' => 'active']);
        $b2e = Brand::query()->create(['principal_id' => $p2->id, 'name' => 'Lifebuoy', 'status' => 'active']);

        // ── Principal 3: PT Wings Surya ──────────────────────────────────
        $p3 = Principal::query()->create([
            'code' => 'PRC-000003',
            'name' => 'PT Wings Surya',
            'contact_person' => 'Agus Pranoto',
            'phone' => '031-843-8888',
            'email' => 'sales@wingscorp.com',
            'address' => 'Jl. Kalisosok Kidul No. 2, Surabaya',
            'status' => 'active',
        ]);
        $b3a = Brand::query()->create(['principal_id' => $p3->id, 'name' => 'Mie Sedaap', 'status' => 'active']);
        $b3b = Brand::query()->create(['principal_id' => $p3->id, 'name' => 'SoKlin', 'status' => 'active']);
        $b3c = Brand::query()->create(['principal_id' => $p3->id, 'name' => 'GIV', 'status' => 'active']);
        $b3d = Brand::query()->create(['principal_id' => $p3->id, 'name' => 'Ale-Ale', 'status' => 'active']);
        $b3e = Brand::query()->create(['principal_id' => $p3->id, 'name' => 'Nuvo', 'status' => 'active']);

        // ── Principal 4: PT Mayora Indah ─────────────────────────────────
        $p4 = Principal::query()->create([
            'code' => 'PRC-000004',
            'name' => 'PT Mayora Indah',
            'contact_person' => 'Hendri Wijaya',
            'phone' => '021-5210-595',
            'email' => 'dist@mayora.co.id',
            'address' => 'Gedung Mayora, Jl. Tomang Raya No. 21-23, Jakarta Barat',
            'status' => 'active',
        ]);
        $b4a = Brand::query()->create(['principal_id' => $p4->id, 'name' => 'Kopiko', 'status' => 'active']);
        $b4b = Brand::query()->create(['principal_id' => $p4->id, 'name' => 'Torabika', 'status' => 'active']);
        $b4c = Brand::query()->create(['principal_id' => $p4->id, 'name' => 'Roma', 'status' => 'active']);
        $b4d = Brand::query()->create(['principal_id' => $p4->id, 'name' => 'Le Minerale', 'status' => 'active']);
        $b4e = Brand::query()->create(['principal_id' => $p4->id, 'name' => 'Energen', 'status' => 'active']);

        // ── Products ─────────────────────────────────────────────────────
        $productNum = 0;

        // --- Indofood brands ---
        $this->createProduct($productNum++, $b1a, $miInstan, 'Indomie Goreng Original', 'pcs', 3500, 2800, 0.085, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '089686010022',
        ], [$tagBestSeller, $tagHalal], [$attrUkuran, $attrRasa], [
            ['name' => 'Karton', 'barcode' => '089686010039', 'qty' => 40, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b1a, $miInstan, 'Indomie Kuah Ayam Bawang', 'pcs', 3500, 2800, 0.085, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '089686010046',
        ], [$tagHalal], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b1a, $miInstan, 'Indomie Goreng Rendang', 'pcs', 3500, 2800, 0.091, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagBestSeller], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b1a, $miInstan, 'Indomie Goreng Pedas', 'pcs', 3500, 2800, 0.085, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagNew], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b1b, $miInstan, 'Pop Mie Ayam', 'pcs', 6500, 5200, 0.075, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrRasa]);
        $this->createProduct($productNum++, $b1c, $snack, 'Chitato Sapi Panggang 68g', 'pcs', 11500, 9200, 0.068, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '089686610123',
        ], [$tagBestSeller, $tagHalal], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b1d, $bumbu, 'Bimoli Minyak Goreng 1L', 'pcs', 32000, 27500, 1.0, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '089686210011',
        ], [$tagHalal], [$attrKemasan], [
            ['name' => 'Karton', 'barcode' => '089686210028', 'qty' => 12, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b1e, $bumbu, 'Indofood Kecap Manis 275ml', 'pcs', 15500, 12500, 0.35, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrUkuran, $attrKemasan]);
        $this->createProduct($productNum++, $b1e, $bumbu, 'Indofood Sambal Pedas 275ml', 'pcs', 14000, 11000, 0.35, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagBestSeller], [$attrUkuran, $attrKemasan]);

        // --- Unilever brands ---
        $this->createProduct($productNum++, $b2a, $deterjen, 'Rinso Anti Noda 800g', 'pcs', 26000, 21000, 0.8, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '8999999527112',
        ], [$tagBestSeller], [$attrUkuran, $attrAroma], [
            ['name' => 'Karton', 'barcode' => '8999999527129', 'qty' => 12, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b2a, $deterjen, 'Rinso Molto 770ml Liquid', 'pcs', 32000, 26000, 0.8, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagNew, $tagPremium], [$attrUkuran, $attrAroma, $attrKemasan]);
        $this->createProduct($productNum++, $b2b, $rambut, 'Sunsilk Black Shine 170ml', 'pcs', 22000, 17500, 0.2, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '8999999058944',
        ], [$tagBestSeller], [$attrUkuran, $attrWarna]);
        $this->createProduct($productNum++, $b2b, $rambut, 'Sunsilk Hijab Recharge 170ml', 'pcs', 24000, 19500, 0.2, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagNew], [$attrUkuran]);
        $this->createProduct($productNum++, $b2c, $sabun, 'Dove Body Wash 400ml', 'pcs', 48000, 38000, 0.45, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagPremium], [$attrUkuran, $attrAroma, $attrKemasan]);
        $this->createProduct($productNum++, $b2d, $bumbu, 'Bango Kecap Manis 275ml', 'pcs', 17000, 13500, 0.35, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '8999999035075',
        ], [$tagBestSeller, $tagHalal], [$attrUkuran, $attrKemasan]);
        $this->createProduct($productNum++, $b2e, $sabun, 'Lifebuoy Sabun Batang Total 10 85g', 'pcs', 5500, 4200, 0.085, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagEkonomi], [$attrUkuran, $attrAroma], [
            ['name' => 'Pack (4pcs)', 'barcode' => null, 'qty' => 4, 'sort' => 0],
            ['name' => 'Karton', 'barcode' => null, 'qty' => 72, 'sort' => 1],
        ]);
        $this->createProduct($productNum++, $b2e, $sabun, 'Lifebuoy Body Wash 400ml', 'pcs', 32000, 25500, 0.45, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrUkuran, $attrAroma, $attrKemasan]);

        // --- Wings brands ---
        $this->createProduct($productNum++, $b3a, $miInstan, 'Mie Sedaap Goreng', 'pcs', 3200, 2600, 0.09, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '8992775221105',
        ], [$tagBestSeller, $tagHalal], [$attrUkuran, $attrRasa], [
            ['name' => 'Karton', 'barcode' => '8992775221112', 'qty' => 40, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b3a, $miInstan, 'Mie Sedaap Kuah Soto', 'pcs', 3200, 2600, 0.087, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b3b, $deterjen, 'SoKlin Liquid 800ml', 'pcs', 24000, 19500, 0.85, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagBestSeller], [$attrUkuran, $attrAroma, $attrKemasan]);
        $this->createProduct($productNum++, $b3c, $sabun, 'GIV White Sabun Batang 76g', 'pcs', 4000, 3200, 0.076, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagEkonomi, $tagHalal], [$attrUkuran, $attrAroma], [
            ['name' => 'Pack (4pcs)', 'barcode' => null, 'qty' => 4, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b3c, $sabun, 'GIV Body Wash Passion Flowers 450ml', 'pcs', 28000, 22500, 0.48, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrUkuran, $attrAroma, $attrKemasan]);
        $this->createProduct($productNum++, $b3d, $minumanKemasan, 'Ale-Ale Rasa Anggur 200ml', 'pcs', 2500, 1900, 0.22, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagEkonomi, $tagHalal], [$attrUkuran, $attrRasa], [
            ['name' => 'Karton', 'barcode' => null, 'qty' => 24, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b3e, $sabun, 'Nuvo Family Antibacterial 80g', 'pcs', 4500, 3600, 0.08, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagEkonomi], [$attrUkuran, $attrAroma]);

        // --- Mayora brands ---
        $this->createProduct($productNum++, $b4a, $kopi, 'Kopiko Brown Coffee 25g', 'pcs', 2000, 1600, 0.025, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '8996001600214',
        ], [$tagBestSeller, $tagHalal], [$attrUkuran], [
            ['name' => 'Renceng (10)', 'barcode' => null, 'qty' => 10, 'sort' => 0],
            ['name' => 'Karton', 'barcode' => null, 'qty' => 120, 'sort' => 1],
        ]);
        $this->createProduct($productNum++, $b4a, $kopi, 'Kopiko 78°C Coffee Latte 240ml', 'pcs', 8500, 6800, 0.26, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagBestSeller, $tagNew], [$attrUkuran, $attrRasa, $attrKemasan]);
        $this->createProduct($productNum++, $b4b, $kopi, 'Torabika Cappuccino 25g', 'pcs', 2200, 1750, 0.025, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagBestSeller], [$attrUkuran], [
            ['name' => 'Renceng (10)', 'barcode' => null, 'qty' => 10, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b4c, $snack, 'Roma Kelapa 300g', 'pcs', 14000, 11200, 0.3, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '8996001302019',
        ], [$tagBestSeller, $tagHalal], [$attrUkuran], [
            ['name' => 'Karton', 'barcode' => null, 'qty' => 12, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b4c, $snack, 'Roma Malkist Crackers 135g', 'pcs', 10500, 8400, 0.135, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b4c, $snack, 'Roma Sari Gandum 240g', 'pcs', 16000, 12800, 0.24, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagPremium, $tagOrganic], [$attrUkuran]);
        $this->createProduct($productNum++, $b4d, $minumanKemasan, 'Le Minerale 600ml', 'pcs', 4000, 2800, 0.62, [
            'tracking' => 'qty', 'is_storable' => true, 'barcode' => '8996001302118',
        ], [$tagBestSeller, $tagHalal], [$attrUkuran, $attrKemasan], [
            ['name' => 'Karton', 'barcode' => null, 'qty' => 24, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b4d, $minumanKemasan, 'Le Minerale 1500ml', 'pcs', 7500, 5500, 1.55, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrUkuran, $attrKemasan], [
            ['name' => 'Karton', 'barcode' => null, 'qty' => 12, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b4e, $sereal, 'Energen Cokelat 30g', 'pcs', 2500, 2000, 0.03, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagBestSeller], [$attrUkuran, $attrRasa], [
            ['name' => 'Renceng (10)', 'barcode' => null, 'qty' => 10, 'sort' => 0],
            ['name' => 'Karton', 'barcode' => null, 'qty' => 100, 'sort' => 1],
        ]);
        $this->createProduct($productNum++, $b4e, $sereal, 'Energen Vanilla 30g', 'pcs', 2500, 2000, 0.03, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal], [$attrUkuran, $attrRasa]);

        // Extra SKUs to reach 40 parents
        $this->createProduct($productNum++, $b1a, $miInstan, 'Indomie Soto Betawi', 'pcs', 3500, 2800, 0.088, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagNew], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b1c, $snack, 'Chitato Keju Bakar 68g', 'pcs', 11500, 9200, 0.068, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagPromo], [$attrUkuran, $attrRasa]);
        $this->createProduct($productNum++, $b2c, $sabun, 'Dove Beauty Bar 90g', 'pcs', 12500, 9800, 0.09, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagPremium], [$attrUkuran, $attrAroma]);
        $this->createProduct($productNum++, $b3d, $minumanKemasan, 'Ale-Ale Rasa Jeruk 200ml', 'pcs', 2500, 1900, 0.22, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagEkonomi], [$attrUkuran, $attrRasa], [
            ['name' => 'Karton', 'barcode' => null, 'qty' => 24, 'sort' => 0],
        ]);
        $this->createProduct($productNum++, $b4a, $snack, 'Kopiko Candy Coffee 150g', 'pcs', 12000, 9600, 0.15, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagHalal, $tagBestSeller], [$attrUkuran]);
        $this->createProduct($productNum++, $b3b, $deterjen, 'SoKlin Softener Soft & Fresh 900ml', 'pcs', 18500, 14800, 0.95, [
            'tracking' => 'qty', 'is_storable' => true,
        ], [$tagPromo], [$attrUkuran, $attrAroma, $attrKemasan]);

        $variantCount = Product::query()->whereNotNull('parent_id')->count();
        $this->command?->info("Seeded {$productNum} parent products with {$variantCount} variants across 4 principals.");
    }

    /**
     * @param  array<string, mixed>  $extra
     * @param  list<ProductTag>  $tags
     * @param  list<ProductAttribute>  $attributes
     * @param  list<array{name: string, barcode: string|null, qty: int, sort: int}>  $packagings
     */
    private function createProduct(
        int $num,
        Brand $brand,
        ProductType $type,
        string $name,
        string $unit,
        float $price,
        float $cost,
        float $weight,
        array $extra,
        array $tags,
        array $attributes,
        array $packagings = [],
    ): Product {
        $payload = array_merge([
            'code' => sprintf('PROD-%06d', $num + 1),
            'brand_id' => $brand->id,
            'product_type_id' => $type->id,
            'name' => $name,
            'unit' => $unit,
            'price' => $price,
            'cost' => $cost,
            'weight' => $weight,
            'status' => 'active',
            'sku' => sprintf('SKU-%06d', $num + 1),
        ], $extra);

        if (Schema::hasColumn('products', 'category')) {
            $payload['category'] = 'merchandise';
        }

        if (Schema::hasColumn('products', 'images')) {
            $payload['images'] = [sprintf('https://picsum.photos/seed/product-demo-%d/640/640', $num + 1)];
        }

        $product = Product::query()->create($payload);

        if ($tags !== []) {
            $product->tags()->sync(array_map(fn (ProductTag $t) => $t->id, $tags));
        }

        foreach ($attributes as $i => $attr) {
            $product->productAttributes()->create([
                'attribute_id' => $attr->id,
                'sort' => $i,
            ]);
        }

        foreach ($packagings as $packaging) {
            $product->packagings()->create($packaging);
        }

        if ($attributes !== []) {
            $this->createVariants($product, $attributes);
        }

        return $product;
    }

    /**
     * @param  list<ProductAttribute>  $attributes
     */
    private function createVariants(Product $parent, array $attributes): void
    {
        $optionSets = [];

        foreach ($attributes as $attribute) {
            $options = $attribute->options->take(3)->values();

            if ($options->isEmpty()) {
                continue;
            }

            $optionSets[] = [
                'attribute' => $attribute,
                'options' => $options,
            ];
        }

        if ($optionSets === []) {
            return;
        }

        /** @var list<list<array{attribute: ProductAttribute, option: \Modules\Product\Models\ProductAttributeOption}>> $combos */
        $combos = [[]];

        foreach ($optionSets as $set) {
            $next = [];

            foreach ($combos as $combo) {
                foreach ($set['options'] as $option) {
                    $next[] = array_merge($combo, [[
                        'attribute' => $set['attribute'],
                        'option' => $option,
                    ]]);
                }
            }

            $combos = $next;

            if (count($combos) > 6) {
                $combos = array_slice($combos, 0, 6);
                break;
            }
        }

        $productAttributes = $parent->productAttributes()->get()->keyBy('attribute_id');

        foreach ($combos as $index => $combo) {
            $suffix = collect($combo)->map(fn (array $part) => $part['option']->name)->implode(' / ');
            $extraPrice = (float) collect($combo)->sum(fn (array $part) => (float) ($part['option']->extra_price ?? 0));

            $variantPayload = [
                'parent_id' => $parent->id,
                'code' => sprintf('%s-V%02d', $parent->code, $index + 1),
                'sku' => sprintf('%s-%02d', $parent->sku ?? $parent->code, $index + 1),
                'brand_id' => $parent->brand_id,
                'product_type_id' => $parent->product_type_id,
                'name' => $parent->name.' — '.$suffix,
                'unit' => $parent->unit,
                'price' => (float) $parent->price + $extraPrice,
                'cost' => $parent->cost,
                'weight' => $parent->weight,
                'volume' => $parent->volume,
                'status' => 'active',
                'tracking' => $parent->tracking,
                'is_storable' => $parent->is_storable,
            ];

            if (Schema::hasColumn('products', 'category')) {
                $variantPayload['category'] = $parent->category ?? 'merchandise';
            }

            if (Schema::hasColumn('products', 'images')) {
                $variantPayload['images'] = $parent->images
                    ?? [sprintf('https://picsum.photos/seed/product-variant-%s-%d/640/640', $parent->id, $index + 1)];
            }

            $variant = Product::query()->create($variantPayload);

            foreach ($combo as $part) {
                $productAttribute = $productAttributes->get($part['attribute']->id);

                if ($productAttribute === null) {
                    continue;
                }

                $attributeValue = ProductAttributeValue::query()->create([
                    'product_id' => $variant->id,
                    'attribute_id' => $part['attribute']->id,
                    'product_attribute_id' => $productAttribute->id,
                    'attribute_option_id' => $part['option']->id,
                    'extra_price' => $part['option']->extra_price,
                ]);

                ProductCombination::query()->create([
                    'product_id' => $variant->id,
                    'product_attribute_value_id' => $attributeValue->id,
                ]);
            }
        }
    }

    private function cleanup(): void
    {
        DB::statement('SET CONSTRAINTS ALL DEFERRED');

        if (Schema::hasTable('product_combinations')) {
            DB::table('product_combinations')->delete();
        }

        if (Schema::hasTable('product_attribute_values')) {
            DB::table('product_attribute_values')->delete();
        }

        if (Schema::hasTable('product_product_attributes')) {
            DB::table('product_product_attributes')->delete();
        }

        if (Schema::hasTable('product_packagings')) {
            DB::table('product_packagings')->delete();
        }

        if (Schema::hasTable('product_product_tag')) {
            DB::table('product_product_tag')->delete();
        }

        if (Schema::hasTable('product_attribute_options')) {
            DB::table('product_attribute_options')->delete();
        }

        if (Schema::hasTable('product_attributes')) {
            DB::table('product_attributes')->delete();
        }

        if (Schema::hasTable('product_tags')) {
            DB::table('product_tags')->delete();
        }

        if (Schema::hasTable('products')) {
            DB::table('products')->delete();
        }

        if (Schema::hasTable('brands')) {
            DB::table('brands')->delete();
        }

        if (Schema::hasTable('principals')) {
            DB::table('principals')->delete();
        }

        if (Schema::hasTable('product_types')) {
            DB::table('product_types')->delete();
        }

        DB::statement('SET CONSTRAINTS ALL IMMEDIATE');

        $this->command?->info('Cleared existing product data.');
    }
}
