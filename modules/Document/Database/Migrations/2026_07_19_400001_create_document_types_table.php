<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            // 'vehicle' | 'driver' — extend to 'company' when needed
            $table->string('entity_type', 20);
            // Stable machine key: 'stnk', 'kir', 'sim_b1', etc. Never change once shipped.
            $table->string('key', 50);
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_required')->default(true);
            // false for documents that never expire, e.g. BPKB
            $table->boolean('has_expiry')->default(true);
            // UI hint: pre-fill expires_at = issued_at + this value
            $table->unsignedSmallInteger('typical_validity_days')->nullable();
            // Days-before-expiry thresholds at which reminders are sent, e.g. [30, 14, 7]
            $table->json('reminder_days');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['entity_type', 'key']);
        });

        $this->seedDefaults();
    }

    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }

    /**
     * Seed the document types every logistics tenant needs out of the box.
     * Uses insertOrIgnore so a re-run (e.g. re-install after purge) is safe.
     */
    private function seedDefaults(): void
    {
        $now = now();

        DB::table('document_types')->insertOrIgnore([
            // ── Vehicle documents ──────────────────────────────────────────
            [
                'entity_type' => 'vehicle',
                'key' => 'stnk',
                'name' => 'STNK',
                'description' => 'Surat Tanda Nomor Kendaraan',
                'is_required' => true,
                'has_expiry' => true,
                'typical_validity_days' => 365,
                'reminder_days' => json_encode([30, 14, 7]),
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'vehicle',
                'key' => 'kir',
                'name' => 'KIR / Uji Berkala',
                'description' => 'Uji berkala kendaraan bermotor, berlaku 6 bulan untuk kendaraan komersial',
                'is_required' => true,
                'has_expiry' => true,
                'typical_validity_days' => 180,
                'reminder_days' => json_encode([60, 30, 14]),
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'vehicle',
                'key' => 'vehicle_insurance',
                'name' => 'Asuransi Kendaraan',
                'description' => 'Polis asuransi kendaraan',
                'is_required' => true,
                'has_expiry' => true,
                'typical_validity_days' => 365,
                'reminder_days' => json_encode([30, 14, 7]),
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'vehicle',
                'key' => 'bpkb',
                'name' => 'BPKB',
                'description' => 'Bukti Pemilikan Kendaraan Bermotor',
                'is_required' => true,
                'has_expiry' => false,
                'typical_validity_days' => null,
                'reminder_days' => json_encode([]),
                'sort_order' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'vehicle',
                'key' => 'siup_angkutan',
                'name' => 'Izin Usaha Angkutan',
                'description' => 'Surat Izin Usaha Angkutan (SIUA)',
                'is_required' => false,
                'has_expiry' => true,
                'typical_validity_days' => 365,
                'reminder_days' => json_encode([30, 14, 7]),
                'sort_order' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // ── Driver documents ───────────────────────────────────────────
            [
                'entity_type' => 'driver',
                'key' => 'ktp',
                'name' => 'KTP',
                'description' => 'Kartu Tanda Penduduk',
                'is_required' => true,
                'has_expiry' => true,
                'typical_validity_days' => 1825,
                'reminder_days' => json_encode([90, 30, 14]),
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'driver',
                'key' => 'sim_a',
                'name' => 'SIM A',
                'description' => 'Surat Izin Mengemudi A (kendaraan penumpang)',
                'is_required' => false,
                'has_expiry' => true,
                'typical_validity_days' => 1825,
                'reminder_days' => json_encode([90, 30, 14]),
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'driver',
                'key' => 'sim_b1',
                'name' => 'SIM B1',
                'description' => 'Surat Izin Mengemudi B1 (kendaraan berat non-gandeng)',
                'is_required' => false,
                'has_expiry' => true,
                'typical_validity_days' => 1825,
                'reminder_days' => json_encode([90, 30, 14]),
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'driver',
                'key' => 'sim_b2',
                'name' => 'SIM B2',
                'description' => 'Surat Izin Mengemudi B2 (kendaraan gandeng/tempelan)',
                'is_required' => false,
                'has_expiry' => true,
                'typical_validity_days' => 1825,
                'reminder_days' => json_encode([90, 30, 14]),
                'sort_order' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'driver',
                'key' => 'skck',
                'name' => 'SKCK',
                'description' => 'Surat Keterangan Catatan Kepolisian',
                'is_required' => true,
                'has_expiry' => true,
                'typical_validity_days' => 365,
                'reminder_days' => json_encode([30, 14, 7]),
                'sort_order' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'entity_type' => 'driver',
                'key' => 'health_cert',
                'name' => 'Surat Keterangan Sehat',
                'description' => 'Surat keterangan sehat dari dokter atau puskesmas',
                'is_required' => false,
                'has_expiry' => true,
                'typical_validity_days' => 365,
                'reminder_days' => json_encode([30, 14, 7]),
                'sort_order' => 6,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
};
