<?php

namespace Modules\TradePromotions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\TradePromotions\Models\TradePromoAward;
use Modules\TradePromotions\Support\PromoAwardSettlementService;
use RuntimeException;

class PromoAwardController extends Controller
{
    public function settle(TradePromoAward $award, PromoAwardSettlementService $settlement): RedirectResponse
    {
        try {
            $result = $settlement->settle($award);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $message = match ($result['settlement_type']) {
            PromoAwardSettlementService::SETTLEMENT_CREDIT_NOTE => __('promotions.messages.award_settled_credit', [
                'id' => $result['settlement_id'],
            ]),
            PromoAwardSettlementService::SETTLEMENT_SALES_ORDER => __('promotions.messages.award_settled_so', [
                'id' => $result['settlement_id'],
            ]),
            default => __('promotions.messages.award_settled'),
        };

        return back()->with('success', $message);
    }
}
