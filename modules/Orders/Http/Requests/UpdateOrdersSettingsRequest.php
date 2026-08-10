<?php

namespace Modules\Orders\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Orders\Support\OrdersSettings;

class UpdateOrdersSettingsRequest extends FormRequest
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
            'auto_confirm_do_from_gin' => ['required', 'boolean'],
            'require_pod_before_trip_complete' => ['required', 'string', Rule::in(OrdersSettings::requirePodModes())],
        ];
    }
}
