<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettingRequest extends FormRequest
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
            'key' => ['required', 'string', 'max:255', 'unique:settings,key', 'regex:/^[a-z0-9_\.]+$/'],
            'group' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'value' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:text,textarea,boolean,number,email,url,select,json,color'],
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
            'key.required' => 'The setting key is required.',
            'key.unique' => 'This setting key already exists.',
            'key.regex' => 'The setting key may only contain lowercase letters, numbers, underscores, and dots.',
            'group.required' => 'The setting group is required.',
            'group.regex' => 'The group may only contain lowercase letters, numbers, and underscores.',
            'type.required' => 'The setting type is required.',
            'type.in' => 'The setting type must be one of: text, textarea, boolean, number, email, url, select, json, color.',
            'label.required' => 'The setting label is required.',
        ];
    }
}
