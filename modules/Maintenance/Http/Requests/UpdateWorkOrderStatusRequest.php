<?php

namespace Modules\Maintenance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Maintenance\Models\WorkOrder;

class UpdateWorkOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        $status = $this->input('status');

        if ($status === WorkOrder::STATUS_APPROVED) {
            return $user->hasPermissionFor('maintenance', 'approve')
                || $user->hasPermissionFor('maintenance', 'update');
        }

        return $user->hasPermissionFor('maintenance', 'update');
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in([
                WorkOrder::STATUS_DRAFT,
                WorkOrder::STATUS_PENDING,
                WorkOrder::STATUS_APPROVED,
                WorkOrder::STATUS_IN_PROGRESS,
                WorkOrder::STATUS_COMPLETED,
                WorkOrder::STATUS_CANCELLED,
            ])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => __('maintenance.messages.status_required'),
            'status.in' => __('maintenance.messages.status_invalid'),
        ];
    }
}
