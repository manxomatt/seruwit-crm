<?php

namespace Modules\Rental\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $code = (string) $this->route('code');

        return [
            'name' => ['required', 'string', 'max:500'],
            'layout_preset' => ['required', 'string', 'in:'.implode(',', \Modules\Rental\Support\DocumentTemplateManager::VALID_LAYOUTS)],
            'content' => ['required', 'array'],
            'content.title' => ['required', 'string', 'max:500'],
            'content.subtitle' => ['nullable', 'string', 'max:1000'],
            'content.intro_html' => ['nullable', 'string'],
            'content.terms_html' => ['nullable', 'string'],
            'content.notes_label' => ['nullable', 'string', 'max:255'],
            'content.footer_html' => ['nullable', 'string'],
            'content.checkout_label' => ['nullable', 'string', 'max:255'],
            'content.return_label' => ['nullable', 'string', 'max:255'],
            'content.bill_to_label' => ['nullable', 'string', 'max:255'],
            'options' => ['required', 'array'],
            'options.show_logo' => ['boolean'],
            'options.show_address' => ['boolean'],
            'options.show_phone' => ['boolean'],
            'options.show_footer' => ['boolean'],
            'options.show_signature' => ['boolean'],
            'options.show_company_info' => ['boolean'],
            'options.show_damage_section' => ['boolean'],
            'options.show_paid_stamp' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => __('rental.validation.document_template_content_required'),
            'layout_preset.in' => __('rental.validation.document_template_layout_invalid'),
            'name.required' => __('rental.validation.document_template_name_required'),
        ];
    }
}
