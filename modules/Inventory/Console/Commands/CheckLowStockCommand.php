<?php

namespace Modules\Inventory\Console\Commands;

use Illuminate\Console\Command;
use Modules\Inventory\Support\LowStockNotifier;

class CheckLowStockCommand extends Command
{
    protected $signature = 'inventory:check-low-stock';

    protected $description = 'Check for low stock items and notify inventory staff';

    public function handle(): int
    {
        $this->info('Checking for low stock items...');

        LowStockNotifier::checkAndNotify();

        $this->info('Low stock check completed.');

        return self::SUCCESS;
    }
}
