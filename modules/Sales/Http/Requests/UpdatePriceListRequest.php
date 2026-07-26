<?php

namespace Modules\Sales\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePriceListRequest extends FormRequest
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
        /** @var \Modules\Sales\Models\PriceList $priceList */
        $priceList = $this->route('priceList');

        return [
            'name' => ['required', 'string', 'max:150'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('price_lists', 'code')->ignore($priceList->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
