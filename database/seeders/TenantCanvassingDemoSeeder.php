<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Canvassing\Models\CanvassingPlan;
use Modules\Canvassing\Models\CanvassingVisit;
use Modules\Canvassing\Models\Salesperson;
use Modules\Partners\Models\Partner;

/**
 * Seeds 30 demo salespeople (+ visits/plans) for the Canvassing module.
 *
 *   php artisan tenants:seed --class=TenantCanvassingDemoSeeder --tenants={id}
 */
class TenantCanvassingDemoSeeder extends Seeder
{
    public const TAG = '[CANVASSING-DEMO]';

    public const SALESPERSON_COUNT = 30;

    /**
     * @var list<string>
     */
    private const NAMES = [
        'Andi Saputra',
        'Budi Hartono',
        'Citra Lestari',
        'Dewi Anggraini',
        'Eko Prasetyo',
        'Fitri Handayani',
        'Gilang Ramadhan',
        'Hana Putri',
        'Irfan Maulana',
        'Joko Widodo',
        'Kartika Sari',
        'Lukman Hakim',
        'Maya Indah',
        'Nugroho Adi',
        'Oki Firmansyah',
        'Putri Ayu',
        'Rizky Fadilah',
        'Siti Aminah',
        'Taufik Hidayat',
        'Umi Kulsum',
        'Vina Melati',
        'Wahyu Nugraha',
        'Xenia Rahma',
        'Yudi Kurniawan',
        'Zahra Aulia',
        'Agus Setiawan',
        'Bayu Pratama',
        'Clara Wijaya',
        'Dian Kusuma',
        'Fajar Nugroho',
    ];

    /**
     * @var list<string>
     */
    private const AREAS = [
        'Jakarta Utara',
        'Jakarta Selatan',
        'Bekasi',
        'Tangerang',
        'Depok',
        'Bogor',
        'Karawang',
        'Bandung',
    ];

    public function run(): void
    {
        if (! class_exists(Salesperson::class) || ! Schema::hasTable('salespeople')) {
            $this->command?->warn('Canvassing tables missing. Install the canvassing module first.');

            return;
        }

        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            $this->command?->warn('Partners table missing.');

            return;
        }

        $partners = $this->ensurePartners();

        if ($this->demoSalespeopleExist()) {
            $this->command?->info('Canvassing demo data already present — skipping create.');
        } else {
            $salespeople = $this->seedSalespeople();
            $this->seedPlansAndVisits($salespeople, $partners);
        }

        $salespersonCount = Salesperson::query()->where('notes', 'like', '%'.self::TAG.'%')->count();
        $visitCount = CanvassingVisit::query()
            ->whereHas('salesperson', fn ($q) => $q->where('notes', 'like', '%'.self::TAG.'%'))
            ->count();
        $planCount = CanvassingPlan::query()
            ->whereHas('salesperson', fn ($q) => $q->where('notes', 'like', '%'.self::TAG.'%'))
            ->count();

        $this->command?->info(sprintf(
            'Canvassing demo ready: %d salespeople, %d visits, %d plans.',
            $salespersonCount,
            $visitCount,
            $planCount,
        ));
        $this->command?->info('Open /module/canvassing/salespeople, /visits, /plans');
    }

    /**
     * @return \Illuminate\Support\Collection<int, Partner>
     */
    protected function ensurePartners()
    {
        $partners = Partner::query()
            ->where('customer_rank', '>', 0)
            ->orderBy('id')
            ->limit(20)
            ->get();

        while ($partners->count() < 10) {
            $index = $partners->count();
            $code = sprintf('CUS-CNV-%02d', $index + 1);
            $partner = Partner::query()->firstOrCreate(
                ['code' => $code],
                [
                    'account_type' => 'company',
                    'sub_type' => 'customer',
                    'name' => 'Outlet Canvassing Demo '.($index + 1),
                    'customer_rank' => 1,
                    'supplier_rank' => 0,
                    'status' => 'active',
                    'notes' => self::TAG.' Demo partner.',
                ],
            );
            $partners->push($partner);
        }

        return $partners->values();
    }

    protected function demoSalespeopleExist(): bool
    {
        return Salesperson::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->count() >= self::SALESPERSON_COUNT;
    }

    /**
     * @return \Illuminate\Support\Collection<int, Salesperson>
     */
    protected function seedSalespeople()
    {
        $created = collect();

        foreach (range(1, self::SALESPERSON_COUNT) as $i) {
            $salesperson = Salesperson::query()->create([
                'name' => self::NAMES[$i - 1] ?? 'Sales Demo '.$i,
                'employee_code' => sprintf('SP-DEMO-%03d', $i),
                'phone' => '0812'.str_pad((string) (2000000 + $i), 7, '0', STR_PAD_LEFT),
                'email' => sprintf('sales.demo%03d@example.test', $i),
                'area' => self::AREAS[($i - 1) % count(self::AREAS)],
                'is_active' => $i % 7 !== 0,
                'notes' => self::TAG.' Seeded for UI pagination demo.',
            ]);
            $created->push($salesperson);
        }

        return $created;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Salesperson>  $salespeople
     * @param  \Illuminate\Support\Collection<int, Partner>  $partners
     */
    protected function seedPlansAndVisits($salespeople, $partners): void
    {
        $outcomes = [
            CanvassingVisit::OUTCOME_PENDING,
            CanvassingVisit::OUTCOME_CONTACTED,
            CanvassingVisit::OUTCOME_INTERESTED,
            CanvassingVisit::OUTCOME_NOT_INTERESTED,
            CanvassingVisit::OUTCOME_NO_CONTACT,
            CanvassingVisit::OUTCOME_CALLBACK,
        ];
        $planStatuses = [
            CanvassingPlan::STATUS_PLANNED,
            CanvassingPlan::STATUS_COMPLETED,
            CanvassingPlan::STATUS_CANCELLED,
        ];

        foreach ($salespeople as $index => $salesperson) {
            $i = $index + 1;

            $plan = CanvassingPlan::query()->create([
                'salesperson_id' => $salesperson->id,
                'plan_date' => now()->subDays($i % 20)->toDateString(),
                'notes' => self::TAG.' Demo plan #'.$i,
                'status' => $planStatuses[($i - 1) % count($planStatuses)],
            ]);

            $visitCount = $i <= 20 ? 2 : 1;
            for ($v = 0; $v < $visitCount; $v++) {
                $checkedIn = now()->subDays(($i + $v) % 25)->subHours(2 + $v);
                $outcome = $outcomes[($i + $v) % count($outcomes)];
                $checkedOut = $outcome === CanvassingVisit::OUTCOME_PENDING
                    ? null
                    : (clone $checkedIn)->addMinutes(20 + ($v * 10));

                CanvassingVisit::query()->create([
                    'salesperson_id' => $salesperson->id,
                    'partner_id' => $partners[($i + $v) % $partners->count()]->id,
                    'plan_id' => $v === 0 ? $plan->id : null,
                    'checked_in_at' => $checkedIn,
                    'checked_out_at' => $checkedOut,
                    'outcome' => $outcome,
                    'notes' => self::TAG.' Demo visit.',
                    'latitude' => -6.2 - (($i % 10) * 0.01),
                    'longitude' => 106.8 + (($i % 10) * 0.01),
                ]);
            }
        }
    }
}
