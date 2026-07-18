<?php

namespace Modules\Billing\Http\Requests;

class UpdateTariffRequest extends StoreTariffRequest
{
    /**
     * The tariff being updated is excluded from the route-uniqueness check.
     */
    protected function ignoreId(): ?int
    {
        return $this->route('tariff')->id;
    }
}
