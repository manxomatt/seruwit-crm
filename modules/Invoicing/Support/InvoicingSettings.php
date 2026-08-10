<?php

namespace Modules\Invoicing\Support;

use App\Models\Setting;

/**
 * Workspace default invoice payment terms. Edited via Invoicing → Settings.
 * Partner-level payment_term_days still overrides when set.
 */
class InvoicingSettings
{
    public const KEY_DEFAULT_PAYMENT_TERM_DAYS = PaymentTerms::SETTING_KEY;

    /**
     * @return list<string>
     */
    public static function managedKeys(): array
    {
        return [self::KEY_DEFAULT_PAYMENT_TERM_DAYS];
    }

    /**
     * @return array{default_payment_term_days: string}
     */
    public static function all(): array
    {
        return [
            'default_payment_term_days' => (string) max(0, (int) Setting::getValue(self::KEY_DEFAULT_PAYMENT_TERM_DAYS, '0')),
        ];
    }

    /**
     * @param  array{default_payment_term_days: int|string}  $data
     */
    public static function update(array $data): void
    {
        Setting::query()->updateOrCreate(
            ['key' => self::KEY_DEFAULT_PAYMENT_TERM_DAYS],
            [
                'group' => 'invoicing',
                'value' => (string) max(0, (int) $data['default_payment_term_days']),
                'type' => 'number',
                'label' => 'Default Payment Term (Days)',
                'description' => 'Managed via Invoicing → Settings. Days until invoice due date. 0 = due on issue date (COD). Partner override wins when set.',
                'is_public' => false,
                'sort_order' => 1,
            ],
        );
    }
}
