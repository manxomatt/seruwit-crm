<?php

namespace App\Http\Requests\Central;

use App\Actions\Auth\EnsureUserHasGlobalId;
use App\Actions\Tenancy\CreateTenantAction;
use App\Models\OnboardingSession;
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
            'subdomain' => ['required', 'string', 'lowercase', new ValidSubdomain($this->ignoreDomainForRetry())],
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

    /**
     * When retrying a failed session for the same subdomain, allow the domain
     * already attached to that half-provisioned tenant.
     */
    private function ignoreDomainForRetry(): ?string
    {
        $authUser = $this->user();

        if ($authUser === null) {
            return null;
        }

        $user = app(EnsureUserHasGlobalId::class)->execute($authUser);

        $session = OnboardingSession::query()
            ->where('global_user_id', $user->global_id)
            ->first();

        if ($session === null || $session->status !== OnboardingSession::STATUS_FAILED || ! $session->tenant_id) {
            return null;
        }

        $subdomain = $this->input('subdomain');

        if (! is_string($subdomain) || $subdomain === '' || $session->subdomain !== $subdomain) {
            return null;
        }

        return CreateTenantAction::fullDomain($subdomain);
    }
}
