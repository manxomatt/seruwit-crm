<?php

namespace App\Modules;

use App\Models\Plan;
use Illuminate\Support\Collection;

/**
 * The one way to read plans, from either central or tenant context.
 *
 * Entitlement is checked many times per request — the sidebar alone asks for every
 * menu — but plans live in the central database. The Plan model pins itself to the
 * central connection so the reads work from tenant context, and this memoizes the
 * whole (tiny) set for the rest of the request: one central query per request
 * rather than one per check, with no plan contents denormalised onto tenants and
 * therefore nothing to drift.
 *
 * Not cached across requests on purpose: the cache store here is `database`, so a
 * cache hit would be a query anyway, and with CacheTenancyBootstrapper disabled
 * the cache table is ambiguous from tenant context.
 */
class PlanRepository
{
    /**
     * @var Collection<int, Plan>|null
     */
    private ?Collection $plans = null;

    /**
     * @return Collection<int, Plan>
     */
    public function all(): Collection
    {
        if ($this->plans !== null) {
            return $this->plans;
        }

        return $this->plans = Plan::query()->ordered()->get();
    }

    public function find(string $key): ?Plan
    {
        return $this->all()->firstWhere('key', $key);
    }

    public function default(): ?Plan
    {
        return $this->all()->firstWhere('is_default', true) ?? $this->all()->first();
    }

    public function defaultKey(): ?string
    {
        return $this->default()?->key;
    }

    /**
     * @return list<string>
     */
    public function keys(): array
    {
        return $this->all()->pluck('key')->all();
    }

    /**
     * Plans that include $moduleKey, so a locked module can say what would unlock it.
     *
     * @return Collection<int, Plan>
     */
    public function offering(string $moduleKey): Collection
    {
        return $this->all()->filter(fn (Plan $plan): bool => $plan->includesModule($moduleKey))->values();
    }

    public function flush(): void
    {
        $this->plans = null;
    }
}
