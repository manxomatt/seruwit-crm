<?php

namespace Modules\Product\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductAttributeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'in:select,color,radio,checkbox'],
            'sort' => ['nullable', 'integer', 'min:0'],
            'options' => ['nullable', 'array'],
            'options.*.id' => ['nullable', 'integer'],
            'options.*.name' => ['required', 'string', 'max:255'],
            'options.*.color' => ['nullable', 'string', 'max:50'],
            'options.*.extra_price' => ['nullable', 'numeric', 'min:0'],
            'options.*.sort' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
