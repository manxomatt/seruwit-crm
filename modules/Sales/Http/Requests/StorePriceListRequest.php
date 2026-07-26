<?php

namespace Modules\Sales\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50', 'unique:price_lists,code'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
