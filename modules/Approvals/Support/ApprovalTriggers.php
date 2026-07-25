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
                'label' => __('approvals.triggers.po_amount.label'),
                'description' => __('approvals.triggers.po_amount.description'),
                'condition_fields' => [
                    ['key' => 'min_amount', 'label' => __('approvals.triggers.po_amount.min_amount'), 'type' => 'number'],
                ],
            ],
            self::CREDIT_LIMIT => [
                'label' => __('approvals.triggers.credit_limit.label'),
                'description' => __('approvals.triggers.credit_limit.description'),
                'condition_fields' => [
                    ['key' => 'requires_exceeded', 'label' => __('approvals.triggers.credit_limit.requires_exceeded'), 'type' => 'boolean'],
                ],
            ],
            self::ORDER_DISCOUNT => [
                'label' => __('approvals.triggers.order_discount.label'),
                'description' => __('approvals.triggers.order_discount.description'),
                'condition_fields' => [
                    ['key' => 'min_discount_percent', 'label' => __('approvals.triggers.order_discount.min_discount_percent'), 'type' => 'number'],
                ],
            ],
            self::ORDER_SLA => [
                'label' => __('approvals.triggers.order_sla.label'),
                'description' => __('approvals.triggers.order_sla.description'),
                'condition_fields' => [
                    ['key' => 'max_lead_hours', 'label' => __('approvals.triggers.order_sla.max_lead_hours'), 'type' => 'number'],
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
