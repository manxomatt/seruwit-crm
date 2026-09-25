<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\ValidCustomDomain;
use Illuminate\Foundation\Http\FormRequest;

class StoreCustomDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'domain' => [
                'required',
                'string',
                'max:255',
                new ValidCustomDomain(),
            ],
        ];
    }
}
