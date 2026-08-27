<?php

namespace App\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Note the absence of `key`: tenants reference their plan by key, so renaming one
 * would orphan every tenant on it. The key is set once, at creation.
 */
class UpdatePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-plans') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'badge' => ['nullable', 'string', 'max:100'],
            'is_popular' => ['boolean'],
            'modules' => ['present', 'array'],
            // Core modules (pages/posts/carousels/…) are always available and may
            // still appear in a plan's module list, so accept them alongside the
            // registered/optional modules — otherwise editing any plan that lists
            // a core module fails validation and silently refuses to save.
            'modules.*' => ['string', Rule::in([...array_keys(Modules::all()), ...array_keys(Modules::core())])],
            'limits' => ['nullable', 'array'],
            'limits.max_vehicles' => ['nullable', 'integer', 'min:0'],
            'limits.max_users' => ['nullable', 'integer', 'min:0'],
            'limits.max_branches' => ['nullable', 'integer', 'min:0'],
            'features_list' => ['nullable', 'array'],
            'features_list.*' => ['string', 'max:255'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_default' => ['boolean'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'annual_price' => ['nullable', 'numeric', 'min:0'],
            'annual_original_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            // PAYG pricing model fields
            'pricing_model' => ['required', 'string', Rule::in(['fixed', 'payg'])],
            'subscription_tier_id' => ['nullable', 'integer', 'exists:subscription_tiers,id'],
            'allow_payg_upgrade' => ['boolean'],
            'include_trial' => ['boolean'],
            'trial_duration_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'modules.*.in' => __('plans.validation.modules_in'),
        ];
    }
}
