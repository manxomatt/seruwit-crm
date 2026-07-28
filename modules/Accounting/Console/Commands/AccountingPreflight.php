<?php

namespace Modules\Accounting\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Illuminate\Console\Command;
use Modules\Accounting\Support\AccountingReadinessService;

class AccountingPreflight extends Command
{
    protected $signature = 'accounting:preflight
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Check Accounting cutover readiness (COA roles, posting rules, period, bank, opening balances)';

    public function handle(AccountingReadinessService $readiness): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        if ($tenants->isEmpty()) {
            $this->warn('No tenants found.');

            return self::SUCCESS;
        }

        $failed = 0;

        foreach ($tenants as $tenant) {
            $this->newLine();
            $this->info("Tenant {$tenant->id} ({$tenant->name})");

            $result = $tenant->run(function () use ($readiness): ?array {
                if (! Modules::available('accounting')) {
                    return null;
                }

                return $readiness->assess();
            });

            if ($result === null) {
                $this->line('  skipped — accounting not available');

                continue;
            }

            foreach ([...$result['blocking'], ...$result['warnings']] as $check) {
                $mark = $check['ok'] ? '<info>OK</info>' : '<error>FAIL</error>';
                $detail = $check['detail'] ? " — {$check['detail']}" : '';
                $this->line("  [{$mark}] {$check['label']}{$detail}");
            }

            if ($result['ready'] && collect($result['warnings'])->every(fn (array $c): bool => $c['ok'])) {
                $this->info('  Ready for pilot operations.');
            } elseif ($result['ready']) {
                $this->warn('  Core posting ready; review warnings before cutover.');
                $failed++;
            } else {
                $this->error('  Not ready — fix blocking checks first.');
                $failed++;
            }
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
