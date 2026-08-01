<?php

namespace App\Http\Requests\Central;

use App\Rules\ValidSubdomain;
use App\Support\Onboarding\SelfServeProvisioningPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'subdomain' => ['required', 'string', 'lowercase', new ValidSubdomain],
            'verticals' => ['required', 'array', 'min:1'],
            'verticals.*' => [
                'required',
                'string',
                Rule::in([
                    SelfServeProvisioningPlan::VERTICAL_RENTAL,
                    SelfServeProvisioningPlan::VERTICAL_TRAVEL,
                ]),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'verticals.required' => __('central.onboarding.validation.verticals_required'),
            'verticals.min' => __('central.onboarding.validation.verticals_required'),
        ];
    }
}
