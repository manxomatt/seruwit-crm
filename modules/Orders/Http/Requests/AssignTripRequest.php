<?php

namespace Modules\Orders\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Modules\TransportationManagement\Models\Trip;

class AssignTripRequest extends FormRequest
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
            'trip_id' => ['required', 'integer', 'exists:trips,id'],
        ];
    }

    /**
     * Orders may only be consolidated onto a trip that has not left yet.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('trip_id')) {
                return;
            }

            $trip = Trip::find($this->input('trip_id'));

            if ($trip && $trip->status !== Trip::STATUS_SCHEDULED) {
                $validator->errors()->add('trip_id', 'Orders can only be assigned to a scheduled trip.');
            }
        });
    }
}
