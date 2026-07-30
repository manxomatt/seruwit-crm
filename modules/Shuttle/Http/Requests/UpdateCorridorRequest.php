<?php

namespace Modules\Shuttle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\Shuttle\Models\ShuttleCity;
use Modules\Shuttle\Models\ShuttlePool;

class UpdateCorridorRequest extends FormRequest
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
        $corridor = $this->route('corridor');

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('shuttle_corridors', 'code')->ignore($corridor)],
            'name' => ['nullable', 'string', 'max:255'],
            'origin_city_id' => ['required', 'exists:shuttle_cities,id'],
            'destination_city_id' => ['required', 'exists:shuttle_cities,id', 'different:origin_city_id'],
            'origin_pool_id' => ['required', 'exists:shuttle_pools,id'],
            'destination_pool_id' => ['required', 'exists:shuttle_pools,id', 'different:origin_pool_id'],
            'base_fare' => ['required', 'numeric', 'min:0'],
            'service_type' => ['required', 'in:pool,door'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:1'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'origin_city_id' => $this->origin_city_id ?: null,
            'destination_city_id' => $this->destination_city_id ?: null,
            'origin_pool_id' => $this->origin_pool_id ?: null,
            'destination_pool_id' => $this->destination_pool_id ?: null,
            'estimated_duration_minutes' => $this->estimated_duration_minutes ?: null,
            'distance_km' => $this->distance_km ?: null,
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $originPool = ShuttlePool::query()->find($this->integer('origin_pool_id'));
            $destinationPool = ShuttlePool::query()->find($this->integer('destination_pool_id'));

            if ($originPool && (int) $originPool->city_id !== $this->integer('origin_city_id')) {
                $validator->errors()->add('origin_pool_id', __('shuttle.validation.pool_city_mismatch'));
            }

            if ($destinationPool && (int) $destinationPool->city_id !== $this->integer('destination_city_id')) {
                $validator->errors()->add('destination_pool_id', __('shuttle.validation.pool_city_mismatch'));
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function corridorAttributes(): array
    {
        $originCity = ShuttleCity::query()->findOrFail($this->integer('origin_city_id'));
        $destinationCity = ShuttleCity::query()->findOrFail($this->integer('destination_city_id'));
        $originPool = ShuttlePool::query()->with('location')->findOrFail($this->integer('origin_pool_id'));
        $destinationPool = ShuttlePool::query()->with('location')->findOrFail($this->integer('destination_pool_id'));

        $data = $this->validated();
        $service = $data['service_type'];
        $name = filled($data['name'] ?? null)
            ? $data['name']
            : sprintf(
                '%s – %s (%s)',
                $originCity->name,
                $destinationCity->name,
                $service === 'door' ? 'Door' : 'Pool',
            );

        return [
            ...$data,
            'name' => $name,
            'origin_city' => $originCity->name,
            'destination_city' => $destinationCity->name,
            'origin_location_id' => $originPool->location_id,
            'destination_location_id' => $destinationPool->location_id,
        ];
    }
}
