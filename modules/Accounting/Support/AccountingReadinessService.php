<?php

namespace Modules\Accounting\Support;

use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\AccountingPostingRule;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\FiscalPeriod;
use Modules\Accounting\Models\FiscalYear;

/**
 * Pilot cutover checklist: COA roles, posting rules, open period, bank/cash,
 * and opening-balance state. Does not mutate data — install migrations already
 * seed the defaults; this reports what still blocks go-live.
 */
class AccountingReadinessService
{
    /**
     * @var list<string>
     */
    public const REQUIRED_SYSTEM_ROLES = [
        'cash',
        'bank',
        'ar_control',
        'ap_control',
        'inventory',
        'grni',
        'tax_input',
        'tax_output',
        'retained_earnings',
        'sales_revenue',
        'pos_revenue',
        'cogs',
        'cash_variance',
    ];

    /**
     * @var list<string>
     */
    public const REQUIRED_POSTING_EVENTS = [
        'invoice.issued',
        'ar_payment.recorded',
        'supplier_bill.issued',
        'bill_payment.recorded',
        'grn.confirmed',
        'gin.confirmed',
        'pos_sale.completed',
    ];

    public function __construct(private readonly OpeningBalanceService $openingBalances) {}

    /**
     * @return array{
     *     ready: bool,
     *     blocking: list<array{key: string, label: string, ok: bool, detail: string|null}>,
     *     warnings: list<array{key: string, label: string, ok: bool, detail: string|null}>,
     *     summary: array<string, mixed>
     * }
     */
    public function assess(): array
    {
        $blocking = [];
        $warnings = [];

        $tablesReady = AccountingPoster::isReady()
            && Schema::hasTable('company_bank_accounts')
            && Schema::hasTable('fiscal_years');

        $blocking[] = [
            'key' => 'schema',
            'label' => __('accounting.readiness.checks.schema'),
            'ok' => $tablesReady,
            'detail' => $tablesReady ? null : __('accounting.readiness.details.schema_missing'),
        ];

        $missingRoles = [];
        if ($tablesReady) {
            $present = Account::query()
                ->where('is_active', true)
                ->where('is_postable', true)
                ->whereIn('system_role', self::REQUIRED_SYSTEM_ROLES)
                ->pluck('system_role')
                ->unique()
                ->all();
            $missingRoles = array_values(array_diff(self::REQUIRED_SYSTEM_ROLES, $present));
        } else {
            $missingRoles = self::REQUIRED_SYSTEM_ROLES;
        }

        $blocking[] = [
            'key' => 'coa_roles',
            'label' => __('accounting.readiness.checks.coa_roles'),
            'ok' => $missingRoles === [],
            'detail' => $missingRoles === []
                ? null
                : __('accounting.readiness.details.missing_roles', ['roles' => implode(', ', $missingRoles)]),
        ];

        $missingEvents = [];
        if ($tablesReady) {
            foreach (self::REQUIRED_POSTING_EVENTS as $event) {
                if (! AccountingPostingRule::query()->where('event_key', $event)->exists()) {
                    $missingEvents[] = $event;
                }
            }
        } else {
            $missingEvents = self::REQUIRED_POSTING_EVENTS;
        }

        $blocking[] = [
            'key' => 'posting_rules',
            'label' => __('accounting.readiness.checks.posting_rules'),
            'ok' => $missingEvents === [],
            'detail' => $missingEvents === []
                ? null
                : __('accounting.readiness.details.missing_events', ['events' => implode(', ', $missingEvents)]),
        ];

        $openPeriod = null;
        if ($tablesReady) {
            $openPeriod = FiscalPeriod::query()
                ->where('status', FiscalPeriod::STATUS_OPEN)
                ->whereDate('starts_on', '<=', now()->toDateString())
                ->whereDate('ends_on', '>=', now()->toDateString())
                ->first();
        }

        $blocking[] = [
            'key' => 'open_period',
            'label' => __('accounting.readiness.checks.open_period'),
            'ok' => $openPeriod !== null,
            'detail' => $openPeriod
                ? $openPeriod->name
                : __('accounting.readiness.details.no_open_period'),
        ];

        $bankCount = $tablesReady ? CompanyBankAccount::query()->where('is_active', true)->count() : 0;
        $blocking[] = [
            'key' => 'bank_accounts',
            'label' => __('accounting.readiness.checks.bank_accounts'),
            'ok' => $bankCount > 0,
            'detail' => $bankCount > 0
                ? __('accounting.readiness.details.bank_count', ['count' => $bankCount])
                : __('accounting.readiness.details.no_bank_accounts'),
        ];

        $openingStatus = 'unavailable';
        $openingDetail = __('accounting.readiness.details.schema_missing');
        $year = null;

        if ($tablesReady) {
            $year = FiscalYear::query()->where('year', (int) now()->format('Y'))->first()
                ?? FiscalYear::query()->orderByDesc('year')->first();

            if ($year === null) {
                $openingStatus = 'no_year';
                $openingDetail = __('accounting.readiness.details.no_fiscal_year');
            } elseif ($this->openingBalances->findOpening($year) !== null) {
                $openingStatus = 'posted';
                $openingDetail = __('accounting.readiness.details.opening_posted', ['year' => (string) $year->year]);
            } elseif ($this->openingBalances->yearHasPostedActivity($year)) {
                $openingStatus = 'blocked';
                $openingDetail = __('accounting.readiness.details.opening_blocked', ['year' => (string) $year->year]);
            } else {
                $openingStatus = 'pending';
                $openingDetail = __('accounting.readiness.details.opening_pending', ['year' => (string) $year->year]);
            }
        }

        $warnings[] = [
            'key' => 'opening_balance',
            'label' => __('accounting.readiness.checks.opening_balance'),
            'ok' => $openingStatus === 'posted',
            'detail' => $openingDetail,
        ];

        // Core posting can run without an opening journal (greenfield / zero start),
        // so opening is a warning unless the year is missing entirely.
        $ready = collect($blocking)->every(fn (array $check): bool => $check['ok'])
            && ! in_array($openingStatus, ['unavailable', 'no_year'], true);

        return [
            'ready' => $ready,
            'blocking' => $blocking,
            'warnings' => $warnings,
            'summary' => [
                'accounts' => $tablesReady ? Account::query()->where('is_active', true)->count() : 0,
                'open_period' => $openPeriod?->only(['id', 'name', 'starts_on', 'ends_on', 'status']),
                'opening_status' => $openingStatus,
                'fiscal_year' => $year?->year,
                'bank_accounts' => $bankCount,
                'missing_roles' => $missingRoles,
                'missing_events' => $missingEvents,
            ],
        ];
    }
}
