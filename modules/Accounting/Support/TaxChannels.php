<?php

namespace Modules\Accounting\Support;

use App\Modules\Facades\Modules;

/**
 * Catalog of document channels that can have a per-channel tax policy.
 *
 * Missing policy rows mean "use workspace default tax code".
 */
class TaxChannels
{
    public const RENTAL_CHARGE = 'rental.rental_charge';

    public const RENTAL_DEPOSIT = 'rental.deposit';

    public const RENTAL_ADDON = 'rental.addon';

    public const SHUTTLE_INVOICE = 'shuttle.invoice';

    public const SALES_INVOICE = 'sales.invoice';

    public const BILLING_ORDER_INVOICE = 'billing.order_invoice';

    public const POS_SALE = 'pos.sale';

    public const INVOICING_MANUAL = 'invoicing.manual';

    public const PROMOTIONS_SETTLEMENT = 'promotions.settlement';

    public const PAYABLES_PURCHASE_BILL = 'payables.purchase_bill';

    /**
     * @return list<array{channel: string, module: string|null, label_key: string}>
     */
    public static function definitions(): array
    {
        return [
            [
                'channel' => self::RENTAL_CHARGE,
                'module' => 'rental',
                'label_key' => 'accounting.tax_policies.channels.rental_charge',
            ],
            [
                'channel' => self::RENTAL_DEPOSIT,
                'module' => 'rental',
                'label_key' => 'accounting.tax_policies.channels.rental_deposit',
            ],
            [
                'channel' => self::RENTAL_ADDON,
                'module' => 'rental',
                'label_key' => 'accounting.tax_policies.channels.rental_addon',
            ],
            [
                'channel' => self::SHUTTLE_INVOICE,
                'module' => 'shuttle',
                'label_key' => 'accounting.tax_policies.channels.shuttle_invoice',
            ],
            [
                'channel' => self::SALES_INVOICE,
                'module' => 'sales',
                'label_key' => 'accounting.tax_policies.channels.sales_invoice',
            ],
            [
                'channel' => self::BILLING_ORDER_INVOICE,
                'module' => 'billing',
                'label_key' => 'accounting.tax_policies.channels.billing_order_invoice',
            ],
            [
                'channel' => self::POS_SALE,
                'module' => 'pos',
                'label_key' => 'accounting.tax_policies.channels.pos_sale',
            ],
            [
                'channel' => self::INVOICING_MANUAL,
                'module' => 'invoicing',
                'label_key' => 'accounting.tax_policies.channels.invoicing_manual',
            ],
            [
                'channel' => self::PROMOTIONS_SETTLEMENT,
                'module' => 'promotions',
                'label_key' => 'accounting.tax_policies.channels.promotions_settlement',
            ],
            [
                'channel' => self::PAYABLES_PURCHASE_BILL,
                'module' => 'payables',
                'label_key' => 'accounting.tax_policies.channels.payables_purchase_bill',
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return array_column(self::definitions(), 'channel');
    }

    public static function isValid(string $channel): bool
    {
        return in_array($channel, self::all(), true);
    }

    /**
     * Channels whose owning module is installed (or has no module gate).
     *
     * @return list<array{channel: string, module: string|null, label_key: string}>
     */
    public static function available(): array
    {
        return array_values(array_filter(
            self::definitions(),
            function (array $definition): bool {
                $module = $definition['module'] ?? null;

                if ($module === null || $module === '') {
                    return true;
                }

                return Modules::available($module);
            },
        ));
    }
}
