<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalStorefrontSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<\Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    public function rules(): array
    {
        $hexColor = ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'];

        return [
            'brand_name' => ['nullable', 'string', 'max:255'],
            'primary_color' => $hexColor,
            'secondary_color' => $hexColor,
            'support_phone' => ['nullable', 'string', 'max:30'],
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'hero_title' => ['nullable', 'string', 'max:255'],
            'hero_subtitle' => ['nullable', 'string', 'max:500'],
            'hero_image_url' => ['nullable', 'url', 'max:2048'],
            'social_instagram' => ['nullable', 'url', 'max:2048'],
            'social_facebook' => ['nullable', 'url', 'max:2048'],
            'social_tiktok' => ['nullable', 'url', 'max:2048'],
            'business_hours' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'primary_color.regex' => __('rental.validation.storefront_color_invalid'),
            'secondary_color.regex' => __('rental.validation.storefront_color_invalid'),
        ];
    }
}
