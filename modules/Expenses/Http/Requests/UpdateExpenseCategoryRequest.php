<?php

namespace Modules\Expenses\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $categoryId = $this->route('category')?->id ?? $this->route('category');

        return [
            'code' => ['required', 'string', 'max:32', Rule::unique('expense_categories', 'code')->ignore($categoryId)],
            'name' => ['required', 'string', 'max:150'],
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Kode kategori biaya wajib diisi.',
            'code.unique' => 'Kode kategori biaya sudah digunakan.',
            'name.required' => 'Nama kategori biaya wajib diisi.',
            'account_id.required' => 'Akun COA beban default wajib dipilih.',
        ];
    }
}
