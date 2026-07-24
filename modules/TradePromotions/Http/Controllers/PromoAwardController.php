<?php

namespace Modules\TradePromotions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\TradePromotions\Models\TradePromoAward;

class PromoAwardController extends Controller
{
    public function settle(TradePromoAward $award): RedirectResponse
    {
        if ($award->status === TradePromoAward::STATUS_SETTLED) {
            return back()->with('error', 'Award already settled.');
        }

        $award->update([
            'status' => TradePromoAward::STATUS_SETTLED,
            'settled_at' => now(),
        ]);

        return back()->with('success', 'Award settled.');
    }
}
