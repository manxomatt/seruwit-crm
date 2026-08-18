<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\ResellerCommission;
use App\Models\ResellerCommissionRule;
use App\Models\ResellerProfile;
use App\Models\Tenant;
use App\Support\Reseller\CommissionQuote;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Decides what a confirmed payment owes the reseller behind the tenant.
 *
 * Resolution walks five tiers, stopping at the first that produces a rate:
 *
 *   1. Rules scoped to this reseller  (most specific match wins — see rank())
 *   2. The reseller's own profile defaults
 *   3. Platform-wide rules            (reseller_global_id IS NULL)
 *   4. Volume tier                    (first-payment events only, see fromTier())
 *   5. config('reseller.*') fallback
 *
 * Returns null whenever no commission is owed — no reseller, expired
 * attribution, terminated partner, occurrence cap reached, or a zero rate.
 * Callers treat null as "nothing to record", never as an error.
 */
class ResellerCommissionResolver
{
    public function resolve(PaymentOrder $order, ?Tenant $tenant = null): ?CommissionQuote
    {
        $tenant ??= Tenant::query()->find($order->tenant_id);

        if ($tenant === null || ! $tenant->hasActiveResellerAttribution()) {
            return null;
        }

        $resellerGlobalId = (string) $tenant->reseller_global_id;
        $profile = ResellerProfile::query()->where('reseller_global_id', $resellerGlobalId)->first();

        if ($profile !== null && ! $profile->canAccrue()) {
            return null;
        }

        $event = $order->type === 'renew'
            ? ResellerCommission::EVENT_RENEWAL
            : ResellerCommission::EVENT_FIRST;

        $occurrence = $this->occurrenceFor($tenant->id);
        $base = round((float) $order->amount, 2);

        if ($base <= 0) {
            return null;
        }

        $rate = $this->resolveRate($order, $resellerGlobalId, $profile, $event, $occurrence);

        if ($rate === null) {
            return null;
        }

        [$type, $value, $rule] = $rate;
        $amount = $this->calculate($type, $value, $base);

        if ($amount <= 0) {
            return null;
        }

        return new CommissionQuote(
            resellerGlobalId: $resellerGlobalId,
            event: $event,
            occurrence: $occurrence,
            baseAmount: $base,
            rateType: $type,
            rateValue: $value,
            commissionAmount: $amount,
            rule: $rule,
        );
    }

    /**
     * Which billing cycle this payment is for the tenant, counting every
     * commission that still represents a live claim.
     */
    private function occurrenceFor(string $tenantId): int
    {
        return ResellerCommission::query()
            ->where('tenant_id', $tenantId)
            ->live()
            ->count() + 1;
    }

    /**
     * @return array{0: string, 1: float, 2: ResellerCommissionRule|null}|null
     */
    private function resolveRate(
        PaymentOrder $order,
        string $resellerGlobalId,
        ?ResellerProfile $profile,
        string $event,
        int $occurrence,
    ): ?array {
        $moment = $order->confirmed_at ?? now();
        $candidates = $this->candidateRules($order, $resellerGlobalId, $event, $moment);

        $own = $this->best($candidates->where('reseller_global_id', $resellerGlobalId));

        if ($own !== null) {
            return $this->fromRule($own, $occurrence);
        }

        if ($profile !== null) {
            $fromProfile = $this->fromProfile($profile, $event);

            if ($fromProfile !== null) {
                return $fromProfile;
            }
        }

        $platform = $this->best($candidates->whereNull('reseller_global_id'));

        if ($platform !== null) {
            return $this->fromRule($platform, $occurrence);
        }

        $tiered = $event === ResellerCommission::EVENT_FIRST
            ? $this->fromTier($resellerGlobalId)
            : null;

        return $tiered ?? $this->fromConfig($event);
    }

    /**
     * Every rule that could apply, in one query — ranking happens in memory
     * because the precedence is a scoring problem, not a filtering one.
     *
     * @return Collection<int, ResellerCommissionRule>
     */
    private function candidateRules(
        PaymentOrder $order,
        string $resellerGlobalId,
        string $event,
        \DateTimeInterface $moment,
    ): Collection {
        return ResellerCommissionRule::query()
            ->effectiveAt($moment)
            ->where(fn (Builder $q) => $q
                ->where('reseller_global_id', $resellerGlobalId)
                ->orWhereNull('reseller_global_id'))
            ->where(fn (Builder $q) => $q
                ->where('plan_id', $order->plan_id)
                ->orWhereNull('plan_id'))
            ->whereIn('applies_to', [$event, ResellerCommissionRule::APPLIES_ALL])
            ->where(fn (Builder $q) => $q
                ->where('billing_interval', $order->billing_interval)
                ->orWhereNull('billing_interval'))
            ->get();
    }

    /**
     * @param  Collection<int, ResellerCommissionRule>  $rules
     */
    private function best(Collection $rules): ?ResellerCommissionRule
    {
        return $rules
            ->sortByDesc(fn (ResellerCommissionRule $rule) => [
                $this->rank($rule),
                $rule->priority,
                $rule->id,
            ])
            ->first();
    }

    /**
     * Specificity score: plan beats interval, and an exact first/renewal match
     * beats a catch-all. Ties fall through to the rule's own priority.
     */
    private function rank(ResellerCommissionRule $rule): int
    {
        return ($rule->plan_id !== null ? 4 : 0)
            + ($rule->applies_to !== ResellerCommissionRule::APPLIES_ALL ? 2 : 0)
            + ($rule->billing_interval !== null ? 1 : 0);
    }

    /**
     * @return array{0: string, 1: float, 2: ResellerCommissionRule|null}|null
     */
    private function fromRule(ResellerCommissionRule $rule, int $occurrence): ?array
    {
        if ($rule->max_occurrences !== null && $occurrence > $rule->max_occurrences) {
            return null;
        }

        return [$rule->type, (float) $rule->value, $rule];
    }

    /**
     * @return array{0: string, 1: float, 2: null}|null
     */
    private function fromProfile(ResellerProfile $profile, string $event): ?array
    {
        $type = $profile->default_commission_type;

        if ($type === null) {
            return null;
        }

        $value = $event === ResellerCommission::EVENT_RENEWAL
            ? $profile->renewal_commission_value ?? $profile->default_commission_value
            : $profile->default_commission_value;

        return $value === null ? null : [$type, (float) $value, null];
    }

    /**
     * The volume-tier rate for a reseller's current standing, or null when
     * tiers are switched off. Always a percentage — a flat volume bonus would
     * not scale the way a tier is meant to.
     *
     * @return array{0: string, 1: float, 2: null}|null
     */
    private function fromTier(string $resellerGlobalId): ?array
    {
        $config = config('reseller.tiers', []);

        if (! ($config['enabled'] ?? false)) {
            return null;
        }

        $levels = collect($config['levels'] ?? [])
            ->filter(fn ($level) => isset($level['min_tenants'], $level['rate']))
            ->sortBy('min_tenants');

        if ($levels->isEmpty()) {
            return null;
        }

        $count = $this->payingTenantCount($resellerGlobalId);

        $level = $levels->filter(fn ($level) => (int) $level['min_tenants'] <= $count)->last();

        if ($level === null) {
            return null;
        }

        return [ResellerCommissionRule::TYPE_PERCENT, (float) $level['rate'], null];
    }

    /**
     * Distinct tenants that have earned this reseller at least one live
     * commission — the same "paying tenants" measure the dashboard shows.
     * Read before the current commission is written, so the sale that
     * crosses a threshold is rewarded starting with the next sale, not
     * retroactively with itself.
     */
    private function payingTenantCount(string $resellerGlobalId): int
    {
        return ResellerCommission::query()
            ->where('reseller_global_id', $resellerGlobalId)
            ->live()
            ->distinct()
            ->count('tenant_id');
    }

    /**
     * @return array{0: string, 1: float, 2: null}|null
     */
    private function fromConfig(string $event): ?array
    {
        $key = $event === ResellerCommission::EVENT_RENEWAL ? 'renewal_rate' : 'default_rate';
        $rate = config("reseller.{$key}");

        if (! is_array($rate) || ! isset($rate['type'], $rate['value'])) {
            return null;
        }

        return [(string) $rate['type'], (float) $rate['value'], null];
    }

    /**
     * A flat fee is capped at the payment itself: a commission may never exceed
     * the money that came in.
     */
    private function calculate(string $type, float $value, float $base): float
    {
        return $type === ResellerCommissionRule::TYPE_FLAT
            ? round(min($value, $base), 2)
            : round($base * $value / 100, 2);
    }
}
