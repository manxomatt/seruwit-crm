<?php

namespace Modules\TradePromotions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Models\TradePromoRealization;
use Modules\TradePromotions\Support\PromoRealizationService;

class PromoRealizationController extends Controller
{
    public function index(Request $request): Response
    {
        $realizations = TradePromoRealization::query()
            ->with([
                'program:id,code,name,type,target_metric,target_amount,status',
                'partner:id,code,name',
                'awards',
            ])
            ->when($request->integer('program_id'), fn ($q, $id) => $q->where('trade_promo_program_id', $id))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/TradePromotions/Realizations/Index', [
            'realizations' => $realizations,
            'programs' => TradePromoProgram::query()->orderByDesc('id')->get(['id', 'code', 'name']),
            'filters' => [
                'program_id' => $request->integer('program_id') ?: null,
            ],
            'can' => [
                'update' => $request->user()?->hasPermissionFor('promotions', 'update') ?? false,
            ],
        ]);
    }

    public function sync(TradePromoProgram $program, PromoRealizationService $service): RedirectResponse
    {
        $rows = $service->syncProgram($program);

        return back()->with('success', __('promotions.messages.synced', ['count' => $rows->count()]));
    }
}
