<?php

namespace Modules\Approvals\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Approvals\Models\ApprovalPolicyLevel;
use Modules\Approvals\Support\ApprovalTriggers;

class UpdateApprovalPolicyRequest extends FormRequest
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
        $policyId = $this->route('policy')?->id ?? $this->route('policy');

        return [
            'key' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('approval_policies', 'key')->ignore($policyId)],
            'name' => ['required', 'string', 'max:150'],
            'trigger_type' => ['required', Rule::in(ApprovalTriggers::keys())],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string', 'max:2000'],
            'conditions' => ['nullable', 'array'],
            'conditions.min_amount' => ['nullable', 'numeric', 'min:0'],
            'conditions.requires_exceeded' => ['nullable', 'boolean'],
            'conditions.min_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'conditions.max_lead_hours' => ['nullable', 'numeric', 'min:0'],
            'levels' => ['required', 'array', 'min:1'],
            'levels.*.level' => ['required', 'integer', 'min:1'],
            'levels.*.name' => ['required', 'string', 'max:100'],
            'levels.*.approver_type' => ['required', Rule::in([
                ApprovalPolicyLevel::APPROVER_ROLE,
                ApprovalPolicyLevel::APPROVER_USER,
                ApprovalPolicyLevel::APPROVER_PERMISSION,
            ])],
            'levels.*.approver_value' => ['required', 'string', 'max:100'],
        ];
    }
}
