<?php

namespace Modules\Canvassing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Canvassing\Models\Salesperson;

class UpdateSalespersonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Salesperson $salesperson */
        $salesperson = $this->route('salesperson');

        return [
            'name' => ['required', 'string', 'max:255'],
            'employee_code' => ['nullable', 'string', 'max:50', 'unique:salespeople,employee_code,'.$salesperson->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
