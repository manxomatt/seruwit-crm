<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * A reseller editing their own landing page copy — deliberately separate from
 * UpdateResellerProfileRequest (admin-only, covers rate/bank/status). Landing
 * copy is marketing content the reseller owns, so it needs its own, much
 * looser authorization: any signed-in reseller, for their own profile only.
 */
class UpdateResellerLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view-reseller-earnings') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'landing_is_enabled' => ['boolean'],
            'landing_headline' => ['nullable', 'string', 'max:120'],
            'landing_subheadline' => ['nullable', 'string', 'max:200'],
            'landing_cta_text' => ['nullable', 'string', 'max:40'],
            'landing_highlights' => ['nullable', 'array', 'max:4'],
            'landing_highlights.*' => ['string', 'max:80'],
        ];
    }
}
