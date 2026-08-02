<?php

namespace Modules\Partners\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Partners\Support\PartnerExportColumns;

class ExportPartnersRequest extends FormRequest
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
        return [
            'format' => ['required', Rule::in(['csv', 'xlsx'])],
            'columns' => ['required', 'array', 'min:1'],
            'columns.*' => ['string', Rule::in(PartnerExportColumns::keys())],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'account_type' => ['nullable', 'string', Rule::in(['company', 'individual'])],
            'role' => ['nullable', 'string', Rule::in(['customer', 'supplier'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'format.in' => __('partners.export.errors.format'),
            'columns.required' => __('partners.export.errors.columns_required'),
            'columns.min' => __('partners.export.errors.columns_required'),
        ];
    }
}
