<?php

namespace Modules\Approvals\Support;

final class ApprovalTriggers
{
    public const PO_AMOUNT = 'purchasing.po.amount';

    public const CREDIT_LIMIT = 'receivables.credit_limit';

    public const ORDER_DISCOUNT = 'orders.discount';

    public const ORDER_SLA = 'orders.sla';

    /**
     * @return array<string, array{label: string, description: string, condition_fields: list<array{key: string, label: string, type: string}>}>
     */
    public static function catalog(): array
    {
        return [
            self::PO_AMOUNT => [
                'label' => 'PO besar',
                'description' => 'Purchase order yang totalnya mencapai / melebihi ambang.',
                'condition_fields' => [
                    ['key' => 'min_amount', 'label' => 'Minimal total PO', 'type' => 'number'],
                ],
            ],
            self::CREDIT_LIMIT => [
                'label' => 'Credit limit',
                'description' => 'Issue invoice yang akan melebihi batas kredit partner.',
                'condition_fields' => [
                    ['key' => 'requires_exceeded', 'label' => 'Hanya jika melebihi limit', 'type' => 'boolean'],
                ],
            ],
            self::ORDER_DISCOUNT => [
                'label' => 'Diskon order',
                'description' => 'Konfirmasi DO dengan diskon di atas ambang.',
                'condition_fields' => [
                    ['key' => 'min_discount_percent', 'label' => 'Minimal diskon %', 'type' => 'number'],
                ],
            ],
            self::ORDER_SLA => [
                'label' => 'Order di luar SLA',
                'description' => 'Konfirmasi DO dengan janji kirim lebih cepat dari lead time SLA.',
                'condition_fields' => [
                    ['key' => 'max_lead_hours', 'label' => 'Lead time minimum (jam)', 'type' => 'number'],
                ],
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::catalog());
    }
}
