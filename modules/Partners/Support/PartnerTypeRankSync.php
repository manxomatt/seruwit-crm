<?php

namespace Modules\Partners\Support;

use Illuminate\Support\Collection;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerType;

class PartnerTypeRankSync
{
    /**
     * @param  list<int>  $typeIds
     */
    public static function sync(Partner $partner, array $typeIds): void
    {
        $partner->types()->sync($typeIds);

        $types = $typeIds === []
            ? collect()
            : PartnerType::query()->whereIn('id', $typeIds)->get();

        $partner->update(self::rankAttributes($types, $partner->customer_rank, $partner->supplier_rank));
    }

    /**
     * @param  Collection<int, PartnerType>  $types
     * @return array{customer_rank: int, supplier_rank: int, sub_type: string}
     */
    public static function rankAttributes(Collection $types, int $existingCustomerRank = 0, int $existingSupplierRank = 0): array
    {
        $hasCustomer = $types->contains(fn (PartnerType $type): bool => $type->affects_customer_rank);
        $hasSupplier = $types->contains(fn (PartnerType $type): bool => $type->affects_supplier_rank);

        return [
            'customer_rank' => $hasCustomer ? max(1, $existingCustomerRank) : 0,
            'supplier_rank' => $hasSupplier ? max(1, $existingSupplierRank) : 0,
            'sub_type' => self::legacySubType($types, $hasCustomer, $hasSupplier),
        ];
    }

    /**
     * @param  Collection<int, PartnerType>  $types
     */
    private static function legacySubType(Collection $types, bool $hasCustomer, bool $hasSupplier): string
    {
        $transactional = $types->first(
            fn (PartnerType $type): bool => $type->affects_customer_rank || $type->affects_supplier_rank,
        );

        if ($transactional !== null && in_array($transactional->code, ['customer', 'supplier', 'other'], true)) {
            return $transactional->code;
        }

        if ($hasCustomer) {
            return 'customer';
        }

        if ($hasSupplier) {
            return 'supplier';
        }

        return 'other';
    }
}
