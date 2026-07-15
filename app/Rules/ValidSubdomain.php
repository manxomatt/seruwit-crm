<?php

namespace App\Rules;

use App\Actions\Tenancy\CreateTenantAction;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Stancl\Tenancy\Database\Models\Domain;

class ValidSubdomain implements ValidationRule
{
    /**
     * Subdomains that would collide with infrastructure or central pages.
     *
     * @var list<string>
     */
    private const RESERVED = [
        'www',
        'app',
        'admin',
        'api',
        'mail',
        'central',
        'assets',
        'static',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('/^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/', $value)) {
            $fail('Subdomain hanya boleh berisi huruf kecil, angka, dan tanda hubung (3–30 karakter).');

            return;
        }

        if (in_array($value, self::RESERVED, true)) {
            $fail('Subdomain ini tidak tersedia.');

            return;
        }

        if (Domain::query()->where('domain', CreateTenantAction::fullDomain($value))->exists()) {
            $fail('Subdomain ini sudah digunakan.');
        }
    }
}
