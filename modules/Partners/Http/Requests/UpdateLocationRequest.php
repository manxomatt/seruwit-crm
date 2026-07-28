<?php

namespace Modules\Partners\Http\Requests;

class UpdateLocationRequest extends StoreLocationRequest
{
    protected function ignoreId(): ?int
    {
        return $this->route('location')?->id;
    }
}
