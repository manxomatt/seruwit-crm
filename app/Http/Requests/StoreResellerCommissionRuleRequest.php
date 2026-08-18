<?php

namespace App\Http\Requests;

use App\Models\ResellerCommissionRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResellerCommissionRuleRequest extends FormRequest
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
            // Null means a platform-wide rule, which is why it is nullable
            // rather than required — see ResellerCommissionResolver.
            'reseller_global_id' => ['nullable', 'uuid', Rule::exists('users', 'global_id')],
            'plan_id' => ['nullable', 'integer', Rule::exists('plans', 'id')],
            'applies_to' => ['required', Rule::in([
                ResellerCommissionRule::APPLIES_FIRST,
                ResellerCommissionRule::APPLIES_RENEWAL,
                ResellerCommissionRule::APPLIES_ALL,
            ])],
            'billing_interval' => ['nullable', Rule::in(['month', 'annual'])],
            'type' => ['required', Rule::in([
                ResellerCommissionRule::TYPE_PERCENT,
                ResellerCommissionRule::TYPE_FLAT,
            ])],
            'value' => ['required', 'numeric', 'min:0'],
            'max_occurrences' => ['nullable', 'integer', 'min:1', 'max:999'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'priority' => ['nullable', 'integer', 'min:-100', 'max:100'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ends_at.after_or_equal' => __('reseller.validation.ends_after_starts'),
            'value.max' => __('reseller.validation.percent_max'),
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator): void {
            if ($this->input('type') === ResellerCommissionRule::TYPE_PERCENT && (float) $this->input('value') > 100) {
                $validator->errors()->add('value', __('reseller.validation.percent_max'));
            }
        });
    }
}
