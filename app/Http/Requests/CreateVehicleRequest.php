<?php

namespace App\Http\Requests;

use App\Services\SubscriptionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CreateVehicleRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'plate_number' => 'required|string|unique:vehicles,plate_number',
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            // Add more rules as needed
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (!$validator->failed()) {
                $this->validateVehicleQuota($validator);
            }
        });
    }

    /**
     * Validate vehicle quota against subscription limits.
     */
    private function validateVehicleQuota(Validator $validator): void
    {
        $tenant = tenancy()->tenant();

        if (!$tenant) {
            return;
        }

        $subscriptionService = app(SubscriptionService::class);
        $currentVehicleCount = $tenant->vehicles()->count();

        if (!$subscriptionService->canAddVehicle($tenant, $currentVehicleCount)) {
            $validator->errors()->add('quota_exceeded', 'You have reached your vehicle quota. Please upgrade your subscription to add more vehicles.');
        }
    }
}
