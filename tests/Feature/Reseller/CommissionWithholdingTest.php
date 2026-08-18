<?php

namespace Tests\Feature\Reseller;

use App\Models\ResellerCommission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithResellerCommissions;

/**
 * PPh withheld from reseller fees at source.
 */
class CommissionWithholdingTest extends TestCase
{
    use RefreshDatabase, WithResellerCommissions;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('reseller.default_rate', ['type' => 'percent', 'value' => 10]);
        config()->set('reseller.withholding', [
            'enabled' => true,
            'with_npwp' => 2,
            'without_npwp' => 4,
        ]);
    }

    private function accrueFor(User $reseller): ResellerCommission
    {
        $order = $this->confirmOrder(
            $this->makeOrder($this->makeTenant($reseller->global_id), $this->makePlan(1_000_000, 'wht-'.uniqid())),
        );

        return ResellerCommission::query()->where('payment_order_id', $order->id)->firstOrFail();
    }

    public function test_a_partner_with_an_npwp_is_withheld_at_the_lower_rate(): void
    {
        $reseller = $this->makeReseller();
        $this->makeProfile($reseller, ['tax_id' => '01.234.567.8-901.000']);

        $commission = $this->accrueFor($reseller);

        // 10% of 1,000,000 = 100,000 gross; 2% withheld = 2,000.
        $this->assertEqualsWithDelta(100_000, (float) $commission->commission_amount, 0.01);
        $this->assertEqualsWithDelta(2_000, (float) $commission->tax_withheld_amount, 0.01);
        $this->assertEqualsWithDelta(98_000, (float) $commission->net_amount, 0.01);
    }

    public function test_a_partner_without_an_npwp_is_withheld_at_the_higher_rate(): void
    {
        $reseller = $this->makeReseller();
        $this->makeProfile($reseller);

        $commission = $this->accrueFor($reseller);

        $this->assertEqualsWithDelta(4_000, (float) $commission->tax_withheld_amount, 0.01);
        $this->assertEqualsWithDelta(96_000, (float) $commission->net_amount, 0.01);
    }

    public function test_a_reseller_with_no_profile_yet_is_treated_as_having_no_npwp(): void
    {
        $commission = $this->accrueFor($this->makeReseller());

        $this->assertEqualsWithDelta(4_000, (float) $commission->tax_withheld_amount, 0.01);
    }

    public function test_withholding_disabled_leaves_the_commission_whole(): void
    {
        config()->set('reseller.withholding', ['enabled' => false, 'with_npwp' => 2, 'without_npwp' => 4]);

        $commission = $this->accrueFor($this->makeReseller());

        $this->assertEqualsWithDelta(0, (float) $commission->tax_withheld_amount, 0.01);
        $this->assertEqualsWithDelta(100_000, (float) $commission->net_amount, 0.01);
    }

    /**
     * The rate is frozen at accrual: adding an NPWP later must not re-price
     * fees that were already earned.
     */
    public function test_adding_an_npwp_later_does_not_re_price_past_commissions(): void
    {
        $reseller = $this->makeReseller();
        $profile = $this->makeProfile($reseller);

        $commission = $this->accrueFor($reseller);
        $profile->update(['tax_id' => '01.234.567.8-901.000']);

        $this->assertEqualsWithDelta(4_000, (float) $commission->fresh()->tax_withheld_amount, 0.01);
    }
}
