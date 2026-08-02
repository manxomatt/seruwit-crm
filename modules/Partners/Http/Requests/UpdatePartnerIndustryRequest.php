<?php

namespace Modules\Partners\Http\Requests;

class UpdatePartnerIndustryRequest extends StorePartnerIndustryRequest
{
    protected function ignoreId(): ?int
    {
        return $this->route('industry')?->id;
    }
}
