<?php

namespace Modules\Partners\Http\Requests;

class UpdatePartnerTypeRequest extends StorePartnerTypeRequest
{
    protected function ignoreId(): ?int
    {
        return $this->route('type')?->id;
    }
}
