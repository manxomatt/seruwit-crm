<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingRequest extends FormRequest
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
            'key' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_\.]+$/',
                Rule::unique('settings', 'key')->ignore($this->route('setting')),
            ],
            'group' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'value' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:text,textarea,boolean,number,email,url,select,json,color,image'],
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_public' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
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
            'key.required' => __('settings.validation.key_required'),
            'key.unique' => __('settings.validation.key_unique'),
            'key.regex' => __('settings.validation.key_regex'),
            'group.required' => __('settings.validation.group_required'),
            'group.regex' => __('settings.validation.group_regex'),
            'type.required' => __('settings.validation.type_required'),
            'type.in' => __('settings.validation.type_in'),
            'label.required' => __('settings.validation.label_required'),
        ];
    }
}
