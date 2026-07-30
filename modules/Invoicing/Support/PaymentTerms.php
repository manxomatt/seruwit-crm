<?php

namespace Modules\Invoicing\Support;

use App\Models\Setting;
use Carbon\CarbonInterface;
use Modules\Partners\Models\Partner;

/**
 * Resolve invoice due dates from tenant default terms and optional partner override.
 */
class PaymentTerms
{
    public const SETTING_KEY = 'invoicing.default_payment_term_days';

    /**
     * Days until due. 0 = cash / due on issue date.
     */
    public static function daysFor(?Partner $partner = null): int
    {
        if ($partner !== null && $partner->payment_term_days !== null) {
            return max(0, (int) $partner->payment_term_days);
        }

        return max(0, (int) Setting::getValue(self::SETTING_KEY, '0'));
    }

    public static function dueDateFor(CarbonInterface|string $issueDate, ?Partner $partner = null): string
    {
        $issue = $issueDate instanceof CarbonInterface
            ? $issueDate->toDateString()
            : (string) $issueDate;

        return \Illuminate\Support\Carbon::parse($issue)
            ->addDays(self::daysFor($partner))
            ->toDateString();
    }
}
