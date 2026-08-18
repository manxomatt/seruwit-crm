<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkResellerPayoutPaidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-resellers') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
