<?php

namespace Modules\DriverScoring\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\DriverScoring\Models\DriverIncentiveRule;

class UpdateIncentiveRuleRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'period' => ['sometimes', 'required', Rule::in([DriverIncentiveRule::PERIOD_WEEKLY, DriverIncentiveRule::PERIOD_MONTHLY])],
            'min_score' => ['sometimes', 'required', 'integer', 'min:0', 'max:100'],
            'min_days' => ['sometimes', 'required', 'integer', 'min:1', 'max:31'],
            'reward_amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'reward_label' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
