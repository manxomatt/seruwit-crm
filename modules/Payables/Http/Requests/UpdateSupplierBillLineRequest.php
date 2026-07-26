<?php

namespace Modules\Payables\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierBillLineRequest extends FormRequest
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
            'amount' => ['required', 'numeric'],
        ];
    }
}
