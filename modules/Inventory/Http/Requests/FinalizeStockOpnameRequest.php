<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinalizeStockOpnameRequest extends FormRequest
{
    /**
     * Finalization operates on the counts already stored on the opname,
     * so no request payload is required.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }

    public function authorize(): bool
    {
        return true;
    }
}
