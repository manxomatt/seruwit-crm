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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'origin_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'destination_location_id' => [
                'nullable',
                'integer',
                'exists:locations,id',
                'different:origin_location_id',
                $this->uniqueLocationRouteRule($this->ignoreId()),
            ],
            'origin' => ['required_without:origin_location_id', 'nullable', 'string', 'max:255'],
            'destination' => [
                'required_without:destination_location_id',
                'nullable',
                'string',
                'max:255',
                $this->uniqueTextRouteRule($this->ignoreId()),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * One tariff per location-pair per customer (and one general tariff).
     */
    protected function uniqueLocationRouteRule(?int $ignoreId = null): \Illuminate\Validation\Rules\Unique
    {
        $rule = Rule::unique('tariffs', 'destination_location_id')
            ->where('origin_location_id', $this->input('origin_location_id'))
            ->when(
                $this->filled('partner_id'),
                fn ($rule) => $rule->where('partner_id', (int) $this->input('partner_id')),
                fn ($rule) => $rule->whereNull('partner_id'),
            );

        if (! $this->filled('origin_location_id') || ! $this->filled('destination_location_id')) {
            return Rule::unique('tariffs', 'destination_location_id')->where(fn () => false);
        }

        return $ignoreId === null ? $rule : $rule->ignore($ignoreId);
    }

    /**
     * Legacy free-text uniqueness, only when location IDs are absent.
     */
    protected function uniqueTextRouteRule(?int $ignoreId = null): \Illuminate\Validation\Rules\Unique
    {
        if ($this->filled('origin_location_id') && $this->filled('destination_location_id')) {
            return Rule::unique('tariffs', 'destination')->where(fn () => false);
        }

        $rule = Rule::unique('tariffs', 'destination')
            ->where('origin', (string) $this->input('origin'))
            ->when(
                $this->filled('partner_id'),
                fn ($rule) => $rule->where('partner_id', (int) $this->input('partner_id')),
                fn ($rule) => $rule->whereNull('partner_id'),
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
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'destination.unique' => 'A tariff for this route and customer already exists.',
            'destination_location_id.unique' => 'A tariff for this route and customer already exists.',
            'destination_location_id.different' => 'Origin and destination locations must differ.',
        ];
    }
}
