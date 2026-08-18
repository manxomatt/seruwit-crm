<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResellerPayoutRequest extends FormRequest
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
            'reseller_global_id' => ['required', 'uuid', Rule::exists('users', 'global_id')],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'period_end.after_or_equal' => __('reseller.validation.ends_after_starts'),
        ];
    }
}
