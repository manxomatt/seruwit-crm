<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCarouselImageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'image' => ['required_without:image_url', 'nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'image_url' => ['required_without:image', 'nullable', 'url', 'max:500'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'link_url' => ['nullable', 'url', 'max:500'],
            'link_target' => ['string', 'in:_self,_blank'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required_without' => 'An image file or image URL is required.',
            'image_url.required_without' => 'An image file or image URL is required.',
            'image.image' => 'The file must be an image.',
            'image.mimes' => 'The image must be a JPEG, PNG, JPG, GIF, or WebP file.',
            'image.max' => 'The image must not exceed 5MB.',
            'image_url.url' => 'The image URL must be a valid URL.',
            'link_url.url' => 'The link URL must be a valid URL.',
            'link_target.in' => 'The link target must be either _self or _blank.',
        ];
    }
}
