<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\Domain;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCustomDomain implements ValidationRule
{
    /**
     * @param  string|null  $ignoreDomain  Existing full domain to exclude from uniqueness check (for edits).
     */
    public function __construct(private readonly ?string $ignoreDomain = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail(__('tenants.validation.custom_domain_format'));

            return;
        }

        $domain = strtolower(trim($value));

        // Must be a valid hostname / FQDN (at least one dot, valid labels, no trailing dot)
        if (! preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $domain)) {
            $fail(__('tenants.validation.custom_domain_format'));

            return;
        }

        // Cannot be an IP address
        if (filter_var($domain, FILTER_VALIDATE_IP)) {
            $fail(__('tenants.validation.custom_domain_format'));

            return;
        }

        // Cannot collide with central domains (e.g. seruwit.com, localhost)
        $centralDomains = (array) config('tenancy.central_domains', []);
        if (in_array($domain, $centralDomains, true)) {
            $fail(__('tenants.validation.custom_domain_reserved'));

            return;
        }

        // Cannot be on the platform tenant base domain (e.g. *.seruwit.com)
        $tenantBaseDomain = (string) config('tenancy.tenant_base_domain');
        if ($tenantBaseDomain !== '' && ($domain === $tenantBaseDomain || str_ends_with($domain, '.'.$tenantBaseDomain))) {
            $fail(__('tenants.validation.custom_domain_reserved'));

            return;
        }

        if ($domain === $this->ignoreDomain) {
            return;
        }

        if (Domain::query()->where('domain', $domain)->exists()) {
            $fail(__('tenants.validation.custom_domain_taken'));
        }
    }
}
