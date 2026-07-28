<?php

namespace Modules\Accounting\Support;

/**
 * Named amounts and context for an operational document event.
 *
 * @phpstan-type AmountMap array{
 *     net?: float,
 *     tax?: float,
 *     total?: float,
 *     paid?: float,
 *     paid_net?: float,
 *     wht?: float,
 *     gross?: float
 * }
 */
final class SourceEvent
{
    /**
     * @param  AmountMap  $amounts
     * @param  array<string, mixed>  $context
     */
    public function __construct(
        public readonly string $key,
        public readonly string $sourceType,
        public readonly int $sourceId,
        public readonly string $occurredAt,
        public readonly array $amounts,
        public readonly ?int $partnerId = null,
        public readonly ?int $warehouseId = null,
        public readonly string $currency = 'IDR',
        public readonly ?string $memo = null,
        public readonly array $context = [],
    ) {}

    public function amount(string $key): float
    {
        return round(abs((float) ($this->amounts[$key] ?? 0)), 2);
    }
}
