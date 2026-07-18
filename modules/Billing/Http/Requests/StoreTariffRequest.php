<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTariffRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'origin' => ['required', 'string', 'max:255'],
            'destination' => [
                'required',
                'string',
                'max:255',
                $this->uniqueRouteRule($this->ignoreId()),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * One tariff per route per customer (and one general tariff per route).
     * Enforced here rather than by a DB unique index because NULL customer_id
     * rows would escape such an index.
     */
    protected function uniqueRouteRule(?int $ignoreId = null): \Illuminate\Validation\Rules\Unique
    {
        $rule = Rule::unique('tariffs', 'destination')
            ->where('origin', (string) $this->input('origin'))
            ->when(
                $this->filled('customer_id'),
                fn ($rule) => $rule->where('customer_id', (int) $this->input('customer_id')),
                fn ($rule) => $rule->whereNull('customer_id'),
            );

        return $ignoreId === null ? $rule : $rule->ignore($ignoreId);
    }

    /**
     * The tariff id to exclude from the uniqueness check; overridden by
     * UpdateTariffRequest.
     */
    protected function ignoreId(): ?int
    {
        return null;
    }

    /**
     * Get the custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'destination.unique' => 'A tariff for this route and customer already exists.',
        ];
    }
}
