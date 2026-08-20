<?php

namespace Modules\Pages\Support;

use App\Models\Plan;

class PricingTableRenderer
{
    /**
     * Render the pricing table component dynamically from database plans.
     */
    public static function render(): string
    {
        $plans = Plan::query()->ordered()->get();

        if ($plans->isEmpty()) {
            return '';
        }

        $html = [];
        $html[] = '<div class="el-pricing-wrapper">';

        // Billing Cycle Toggle (Monthly / Annual)
        $html[] = '  <div class="el-pricing-toggle-wrap">';
        $html[] = '    <div class="el-pricing-toggle" id="elPricingToggle">';
        $html[] = '      <button type="button" class="el-toggle-btn active" data-period="monthly">'.__('landing_elevate.pricing.monthly').'</button>';
        $html[] = '      <button type="button" class="el-toggle-btn" data-period="annual">';
        $html[] = '        '.__('landing_elevate.pricing.annual');
        $html[] = '        <span class="el-save-badge">'.__('landing_elevate.pricing.save_badge').'</span>';
        $html[] = '      </button>';
        $html[] = '    </div>';
        $html[] = '  </div>';

        // Grid of Plans
        $html[] = '  <div class="el-pricing-grid">';

        foreach ($plans as $plan) {
            $isPopular = (bool) $plan->is_popular;
            $isFree = ((float) $plan->price) <= 0;
            $badge = $plan->badge ?: ($isPopular ? __('landing_elevate.pricing.popular_badge') : ($isFree ? __('landing_elevate.pricing.free_badge') : ''));

            $monthlyPriceFormatted = $isFree ? __('landing_elevate.pricing.free_price') : 'Rp '.number_format((float) $plan->price, 0, ',', '.');

            // Calculate annual price (per month equivalent or total)
            $annualPrice = (float) ($plan->annual_price > 0 ? $plan->annual_price : ($plan->price * 12 * 0.8));
            $annualPerMonth = $isFree ? 0 : round($annualPrice / 12);
            $annualPriceFormatted = $isFree ? __('landing_elevate.pricing.free_price') : 'Rp '.number_format($annualPerMonth, 0, ',', '.');
            $annualTotalFormatted = $isFree ? '' : 'Rp '.number_format($annualPrice, 0, ',', '.').__('landing_elevate.pricing.per_year');

            $cardClass = 'el-price-card'.($isPopular ? ' el-price-popular' : '');

            $html[] = '    <div class="'.$cardClass.'">';

            if ($badge) {
                $html[] = '      <div class="el-price-badge">'.e($badge).'</div>';
            }

            $html[] = '      <div class="el-price-header">';
            $html[] = '        <h3 class="el-price-name">'.e($plan->name).'</h3>';
            if ($plan->description) {
                $html[] = '        <p class="el-price-desc">'.e($plan->description).'</p>';
            }
            $html[] = '      </div>';

            // Price Section
            $html[] = '      <div class="el-price-box">';
            $html[] = '        <div class="el-price-amount-wrap">';
            $html[] = '          <span class="el-price-num" data-monthly="'.e($monthlyPriceFormatted).'" data-annual="'.e($annualPriceFormatted).'">'.e($monthlyPriceFormatted).'</span>';
            if (! $isFree) {
                $html[] = '          <span class="el-price-period">'.__('landing_elevate.pricing.per_month').'</span>';
            }
            $html[] = '        </div>';

            if (! $isFree) {
                $html[] = '        <div class="el-price-subtext" data-monthly="" data-annual="'.e($annualTotalFormatted).'"></div>';
            } else {
                $html[] = '        <div class="el-price-subtext">'.__('landing_elevate.pricing.free_badge').'</div>';
            }
            $html[] = '      </div>';

            // CTA Button
            $ctaText = $isPopular ? __('landing_elevate.pricing.cta_popular') : ($isFree ? __('landing_elevate.pricing.cta_free') : __('landing_elevate.pricing.cta_choose'));
            $ctaBtnClass = $isPopular ? 'el-btn-glow el-price-btn' : 'el-btn-price-outline el-price-btn';
            $registerUrl = '/register?plan='.urlencode($plan->key);

            $html[] = '      <div class="el-price-action">';
            $html[] = '        <a href="'.e($registerUrl).'" class="'.$ctaBtnClass.'">'.e($ctaText).'</a>';
            $html[] = '      </div>';

            // Features List
            $features = $plan->features_list ?? [];
            if (! empty($features)) {
                $html[] = '      <div class="el-price-features">';
                $html[] = '        <div class="el-feat-head">'.__('landing_elevate.pricing.features_title').'</div>';
                $html[] = '        <ul class="el-feat-list">';
                foreach ($features as $feat) {
                    $html[] = '          <li><span class="el-feat-chk">✓</span> <span>'.e($feat).'</span></li>';
                }
                $html[] = '        </ul>';
                $html[] = '      </div>';
            }

            $html[] = '    </div>';
        }

        $html[] = '  </div>';

        // Guarantee footer note
        $html[] = '  <div class="el-pricing-footer-note">';
        $html[] = '    <span>🛡️ '.__('landing_elevate.pricing.guarantee').'</span>';
        $html[] = '  </div>';

        // JavaScript for Monthly/Annual Toggle
        $html[] = '  <script>
    (function() {
      var toggleWrap = document.getElementById("elPricingToggle");
      if (!toggleWrap) return;
      var buttons = toggleWrap.querySelectorAll(".el-toggle-btn");
      var priceNums = document.querySelectorAll(".el-price-num");
      var priceSubtexts = document.querySelectorAll(".el-price-subtext");
      
      buttons.forEach(function(btn) {
        btn.addEventListener("click", function() {
          var period = btn.getAttribute("data-period");
          buttons.forEach(function(b) { b.classList.remove("active"); });
          btn.classList.add("active");
          
          priceNums.forEach(function(el) {
            var val = el.getAttribute("data-" + period);
            if (val) el.textContent = val;
          });
          
          priceSubtexts.forEach(function(el) {
            var val = el.getAttribute("data-" + period);
            if (val !== null) el.textContent = val;
          });
        });
      });
    })();
  </script>';

        $html[] = '</div>';

        return implode("\n", $html);
    }
}
