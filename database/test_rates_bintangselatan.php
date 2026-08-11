<?php
// ─────────────────────────────────────────────────────────────
// 🎯 SKRIP UJI OTOMATIS TARIF RENTAL — TENANT BINTANGSELATAN
// ─────────────────────────────────────────────────────────────

use App\Models\Tenant;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalRateResolver;
use Modules\Fleet\Support\VehicleRentalClass;

// 1. Pilih tenant bintangselatan
$tenant = Tenant::query()->where('id', '5ae0f5ff-aa3c-474a-93a5-eed3e07d0167')->firstOrFail();

$tenant->run(function () {

    // ── 2. Bersihkan rate dengan prefix [R0 (jika ada rerun) ──
    RentalRate::query()->where('name', 'like', '[R0%')->delete();

    // ── 3. Buat 5 rate sesuai skema uji ─────────────────────
    $vAvanza  = 1;  // ⚠️ Ganti dengan Avanza id tenantmu!
    $vInnova  = 2;  // ⚠️ Ganti dengan Innova id tenantmu!
    $vPajero  = 3;  // ⚠️ Ganti dengan Pajero id tenantmu!
    $vAlphard = 4;  // ⚠️ Ganti dengan Alphard id tenantmu!

    // T1 — DEFAULT / UMUM (score 10)
    RentalRate::query()->create([
        'name' => '[R01] DEFAULT All Vehicle - Daily',
        'period_type' => 'daily',
        'vehicle_id' => null,
        'rental_class' => null,
        'vehicle_type' => null,
        'rate_per_period' => 300000,
        'deposit_amount' => 0,
        'late_fee_per_day' => 25000,
        'km_limit_per_period' => 100,
        'excess_km_rate' => 1500,
        'min_periods' => 1,
        'priority' => 0,
        'is_active' => true,
        'valid_from' => null,
        'valid_to' => null,
        'notes' => 'Fallback umum (score 10)',
    ]);

    // T2 — LEGACY Type = MPV (score 100)
    RentalRate::query()->create([
        'name' => '[R02] LEGACY Type=MPV - Daily',
        'period_type' => 'daily',
        'vehicle_id' => null,
        'rental_class' => null,
        'vehicle_type' => 'MPV',
        'rate_per_period' => 550000,
        'deposit_amount' => 250000,
        'late_fee_per_day' => 50000,
        'km_limit_per_period' => 120,
        'excess_km_rate' => 2000,
        'min_periods' => 2,
        'priority' => 0,
        'is_active' => true,
        'valid_from' => null,
        'valid_to' => null,
        'notes' => 'Legacy vehicle_type=MPV (score 100). match dg vehicle.type ATAU rental_class',
    ]);

    // T3 — RENTAL CLASS Economy REGULER (score 200, priority 0)
    RentalRate::query()->create([
        'name' => '[R03] CLASS Economy - Daily Reguler',
        'period_type' => 'daily',
        'vehicle_id' => null,
        'rental_class' => VehicleRentalClass::ECONOMY,
        'vehicle_type' => null,
        'rate_per_period' => 400000,
        'deposit_amount' => 150000,
        'late_fee_per_day' => 35000,
        'km_limit_per_period' => 150,
        'excess_km_rate' => 1500,
        'min_periods' => 1,
        'priority' => 0,
        'is_active' => true,
        'valid_from' => null,
        'valid_to' => null,
        'notes' => 'Class Economy reguler (score 200, priority=0). Akan kalah priority dg T4 ketika bulan libur.',
    ]);

    // T4 — RENTAL CLASS Economy HIGH SEASON (score 200 SAMA DENGAN T3, TAPI PRIORITY=10)
    RentalRate::query()->create([
        'name' => '[R04] CLASS Economy HIGH Season Lebaran',
        'period_type' => 'daily',
        'vehicle_id' => null,
        'rental_class' => VehicleRentalClass::ECONOMY,
        'vehicle_type' => null,
        'rate_per_period' => 650000,
        'deposit_amount' => 300000,
        'late_fee_per_day' => 60000,
        'km_limit_per_period' => 120,
        'excess_km_rate' => 2000,
        'min_periods' => 3,
        'priority' => 10,  // ⭐ tie-breaker!
        'is_active' => true,
        'valid_from' => '2026-12-15',  // musim liburan
        'valid_to'   => '2027-01-15',
        'notes' => 'Class Economy LEBERAN (score 200 SAMA dg T3, tapi priority=10. MENANG jika tanggal dalam musim!)',
    ]);

    // T5 — SPESIFIK VEHICLE ID: Avanza (score 300 PALING TINGGI)
    RentalRate::query()->create([
        'name' => '[R05] SPESIFIK UNIT: Avanza B-1001-XYZ',
        'period_type' => 'daily',
        'vehicle_id' => $vAvanza,  // 🥇 score 300 karena target 1 unit spesifik
        'rental_class' => null,
        'vehicle_type' => null,
        'rate_per_period' => 475000,
        'deposit_amount' => 200000,
        'late_fee_per_day' => 40000,
        'km_limit_per_period' => 180,
        'excess_km_rate' => 1800,
        'min_periods' => 1,
        'priority' => 0,
        'is_active' => true,
        'valid_from' => null,
        'valid_to' => null,
        'notes' => 'Khusus Avanza unit ID=1 (score 300 PALING TINGGI, mengalahkan T1, T3, T4 walaupun priority=0!)',
    ]);

    echo "✅ 5 RATE BERHASIL DIBUAT:\n";
    RentalRate::query()->orderBy('id')->get(['id', 'name'])->each(fn($r) => print("  {$r->id}) {$r->name}\n"));

    // ── 4. 🧪 EKSEKUSI 6 SKENARIO UJI DENGAN RESOLVER ────────────
    echo "\n\n🧪 ============== HASIL UJI RentalRateResolver ==============\n";
    $resolver = app(RentalRateResolver::class);
    $period = 'daily';

    $candidates = [
        'A1. Avanza, Tgl Normal (2026-08-15)' => [$vAvanza,  '2026-08-15', '[R05] SPESIFIK UNIT: Avanza'],    // Exp: T5 (300 menang)
        'A2. Avanza, Tgl Libur (2027-01-01)'  => [$vAvanza,  '2027-01-01', '[R05] SPESIFIK UNIT: Avanza'],    // Exp: T5 (300>200)
        'B3. Innova, Tgl Normal (2026-08-15)' => [$vInnova,  '2026-08-15', '[R02] LEGACY Type=MPV'],         // Exp: T2 (100 karena MPV match)
        'C4. Pajero, Tgl Normal (2026-08-15)' => [$vPajero,  '2026-08-15', '[R01] DEFAULT All Vehicle'],     // Exp: T1 (10 fallback)
        'E5. Economy X, Tgl Normal (2026-08)' => [$vAvanza === 0 ? 0 : $vAvanza,  '2026-08-20', '[R03] CLASS Economy - Daily Reguler'], // ⚠️ lihat note!
        'F6. Economy X, Tgl Libur (2026-12-25)' => [$vAvanza === 0 ? 0 : $vAvanza, '2026-12-25', '[R04] CLASS Economy HIGH Season'],   // ⚠️ lihat note!
    ];

    // ⚠️ NOTE: Kasus E5 & F6 butuh kendaraan BARU dengan class=economy TAPI bukan Avanza (ID!=1)
    // Karena jika Avanza dipakai → akan selalu menang T5 score 300.
    // Sementara jika kita tidak punya unit economy lain, gunakan pola:
    // Untuk test E5/F6 murni tanpa gangguan T5, ganti $vAvanza di T5 menjadi ID lain sementara,
    // ATAU buat economy baru dan pakai ID itu di E5/F6.

    // (Biar tidak error, sementara kita map E5/F6 ke vehicle_id baru dummy jika ada):
    // Cari economy non-Avanza:
    $nonAvanzaEco = \Modules\Fleet\Models\Vehicle::query()
        ->where('rental_class', VehicleRentalClass::ECONOMY)
        ->whereKeyNot($vAvanza)
        ->value('id');

    if ($nonAvanzaEco) {
        $candidates['E5. Economy NON-Avanza (tgl normal)'] = [$nonAvanzaEco, '2026-08-20', '[R03] CLASS Economy - Daily Reguler'];
        $candidates['F6. Economy NON-Avanza (LEBARAN)']     = [$nonAvanzaEco, '2026-12-25', '[R04] CLASS Economy HIGH Season Lebaran'];
    }

    // Jalankan resolver:
    $ok = 0;
    $fail = 0;
    foreach ($candidates as $label => [$vid, $tgl, $expected]) {
        $v = \Modules\Fleet\Models\Vehicle::query()->find($vid);
        if (!$v) {
            echo "⚠️ $label: Vehicle ID=$vid tidak ditemukan\n";
            $fail++;
            continue;
        }
        $start = \Illuminate\Support\Carbon::parse($tgl)->startOfDay();
        $end   = $start->copy()->addDay();
        $periods = 1;

        $rate = $resolver->suggest($v, $period, $periods, $start, $end);
        $actual = $rate ? $rate->name : 'NULL (NO RATE!)';
        $pass = $rate && str_starts_with($actual, explode('] ', $expected)[0] . ']');
        $icon = $pass ? '✅' : '❌';
        echo "$icon $label\n" .
            "     => Ekspektasi: $expected\n" .
            "     => Aktual   : $actual\n";
        if ($pass) $ok++;
        else $fail++;
    }

    echo "\n🏁 RINGKASAN: $ok LULUS, $fail GAGAL dari " . count($candidates) . " skenario uji.\n";
});
