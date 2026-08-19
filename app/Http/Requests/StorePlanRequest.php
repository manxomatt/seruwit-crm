<?php

namespace App\Http\Requests;

use App\Modules\Facades\Modules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
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
            // Tenants carry the key, not a foreign key, so it is the plan's
            // identity for good — see PlanController::update, which refuses to
            // change it.
            'key' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/', Rule::unique('plans', 'key')],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'badge' => ['nullable', 'string', 'max:100'],
            'is_popular' => ['boolean'],
            'modules' => ['present', 'array'],
            'modules.*' => ['string', Rule::in(array_keys(Modules::all()))],
            'limits' => ['nullable', 'array'],
            'limits.max_vehicles' => ['nullable', 'integer', 'min:0'],
            'limits.max_users' => ['nullable', 'integer', 'min:0'],
            'limits.max_branches' => ['nullable', 'integer', 'min:0'],
            'features_list' => ['nullable', 'array'],
            'features_list.*' => ['string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_default' => ['boolean'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'annual_price' => ['nullable', 'numeric', 'min:0'],
            'annual_original_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            // How long a tenant gets on this plan before it must convert to a
            // paid one. Read live wherever a trial period is granted — see
            // ProvisionSelfServeTenantJob and TenantController::store() —
            // rather than assuming a fixed number of days anywhere in code.
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'key.regex' => __('plans.validation.key_regex'),
            'key.unique' => __('plans.validation.key_unique'),
            'modules.*.in' => __('plans.validation.modules_in'),
        ];
    }
}
