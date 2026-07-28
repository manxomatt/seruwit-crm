<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingReadinessService;

class AccountingDashboardController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(AccountingReadinessService $readiness): Response
    {
        $openPeriod = FiscalPeriod::query()
            ->where('status', FiscalPeriod::STATUS_OPEN)
            ->whereDate('starts_on', '<=', now()->toDateString())
            ->whereDate('ends_on', '>=', now()->toDateString())
            ->first();

        $assessment = $readiness->assess();

        return inertia('Modules/Accounting/Dashboard', [
            'stats' => [
                'accounts' => Account::query()->where('is_active', true)->count(),
                'draft_journals' => JournalEntry::query()->where('status', JournalEntry::STATUS_DRAFT)->count(),
                'posted_journals' => JournalEntry::query()->where('status', JournalEntry::STATUS_POSTED)->count(),
                'open_period' => $openPeriod?->only(['id', 'name', 'starts_on', 'ends_on', 'status']),
            ],
            'readiness' => [
                'ready' => $assessment['ready'],
                'blocking' => $assessment['blocking'],
                'warnings' => $assessment['warnings'],
                'opening_status' => $assessment['summary']['opening_status'],
            ],
            'can' => $this->permissions(),
        ]);
    }

    /**
     * @return array<string, bool>
     */
    private function permissions(): array
    {
        $user = auth()->user();

        return [
            'manage_coa' => $user?->hasPermissionFor('accounting', 'manage_coa') ?? false,
            'journal' => $user?->hasPermissionFor('accounting', 'journal') ?? false,
            'post' => $user?->hasPermissionFor('accounting', 'post') ?? false,
            'period' => $user?->hasPermissionFor('accounting', 'period') ?? false,
        ];
    }
}
