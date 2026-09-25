<?php

namespace Modules\Rental\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalStorefrontSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<\Illuminate\Contracts\Validation\ValidationRule|string|Closure>>
     */
    public function rules(): array
    {
        $hexColor = ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'];
        $urlOrPath = ['nullable', 'string', 'max:2048', function (string $attribute, mixed $value, Closure $fail): void {
            if (! is_string($value) || $value === '') {
                return;
            }

            if (str_starts_with($value, '/') || filter_var($value, FILTER_VALIDATE_URL)) {
                return;
            }

            $fail('validation.url')->translate();
        }];

        return [
            'brand_name' => ['nullable', 'string', 'max:255'],
            'primary_color' => $hexColor,
            'secondary_color' => $hexColor,
            'support_phone' => ['nullable', 'string', 'max:30'],
            'logo_url' => $urlOrPath,
            'hero_title' => ['nullable', 'string', 'max:255'],
            'hero_subtitle' => ['nullable', 'string', 'max:500'],
            'hero_image_url' => $urlOrPath,
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
