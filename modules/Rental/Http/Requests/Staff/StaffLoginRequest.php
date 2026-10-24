<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StaffLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }
}
