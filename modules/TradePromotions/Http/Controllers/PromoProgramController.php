<?php

namespace Modules\TradePromotions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Modules\TradePromotions\Http\Requests\StorePromoProgramRequest;
use Modules\TradePromotions\Http\Requests\UpdatePromoProgramRequest;
use Modules\TradePromotions\Models\TradePromoProgram;

class PromoProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $programs = TradePromoProgram::query()
            ->with('principal:id,name')
            ->withCount(['partners', 'products', 'realizations', 'awards'])
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->string('type')->toString(), fn ($q, $type) => $q->where('type', $type))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/TradePromotions/Programs/Index', [
            'programs' => $programs,
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
                'type' => $request->string('type')->toString() ?: null,
            ],
            'can' => [
                'create' => $request->user()?->hasPermissionFor('promotions', 'create') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/TradePromotions/Programs/Create', [
            'partners' => Partner::query()->where('customer_rank', '>', 0)->orderBy('name')->get(['id', 'code', 'name']),
            'products' => Product::query()->orderBy('name')->limit(200)->get(['id', 'code', 'sku', 'name', 'price']),
            'principals' => Principal::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(StorePromoProgramRequest $request): RedirectResponse
    {
        $program = DB::transaction(function () use ($request): TradePromoProgram {
            $data = $request->validated();

            $program = TradePromoProgram::query()->create([
                'code' => TradePromoProgram::nextCode(),
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'],
                'status' => TradePromoProgram::STATUS_DRAFT,
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'principal_id' => $data['principal_id'] ?? null,
                'target_metric' => $data['target_metric'],
                'target_amount' => $data['target_amount'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $this->syncRelations($program, $data);

            return $program;
        });

        return redirect()
            ->route('module.promotions.programs.show', $program)
            ->with('success', "Program {$program->code} created.");
    }

    public function show(Request $request, TradePromoProgram $program): Response
    {
        $program->load([
            'principal:id,name,code',
            'partners:id,code,name',
            'products:id,code,sku,name',
            'tiers.freeProduct:id,code,name',
            'rebateRule',
            'realizations.partner:id,code,name',
            'realizations.awards',
            'creator:id,name',
        ]);

        return Inertia::render('Modules/TradePromotions/Programs/Show', [
            'program' => $program,
            'can' => [
                'update' => $request->user()?->hasPermissionFor('promotions', 'update') ?? false,
                'delete' => $request->user()?->hasPermissionFor('promotions', 'delete') ?? false,
                'settle' => $request->user()?->hasPermissionFor('promotions', 'settle') ?? false,
            ],
        ]);
    }

    public function edit(TradePromoProgram $program): Response
    {
        $program->load(['partners:id', 'products:id', 'tiers', 'rebateRule']);

        return Inertia::render('Modules/TradePromotions/Programs/Edit', [
            'program' => $program,
            'partners' => Partner::query()->where('customer_rank', '>', 0)->orderBy('name')->get(['id', 'code', 'name']),
            'products' => Product::query()->orderBy('name')->limit(200)->get(['id', 'code', 'sku', 'name', 'price']),
            'principals' => Principal::query()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    public function update(UpdatePromoProgramRequest $request, TradePromoProgram $program): RedirectResponse
    {
        if ($program->status === TradePromoProgram::STATUS_CLOSED) {
            return back()->with('error', 'Closed programs cannot be edited.');
        }

        DB::transaction(function () use ($request, $program): void {
            $data = $request->validated();

            $program->update([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'principal_id' => $data['principal_id'] ?? null,
                'target_metric' => $data['target_metric'],
                'target_amount' => $data['target_amount'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->syncRelations($program, $data);
        });

        return redirect()
            ->route('module.promotions.programs.show', $program)
            ->with('success', 'Program updated.');
    }

    public function activate(TradePromoProgram $program): RedirectResponse
    {
        $program->update(['status' => TradePromoProgram::STATUS_ACTIVE]);

        return back()->with('success', 'Program activated.');
    }

    public function close(TradePromoProgram $program): RedirectResponse
    {
        $program->update(['status' => TradePromoProgram::STATUS_CLOSED]);

        return back()->with('success', 'Program closed.');
    }

    public function destroy(TradePromoProgram $program): RedirectResponse
    {
        if ($program->status === TradePromoProgram::STATUS_ACTIVE) {
            return back()->with('error', 'Deactivate or close the program before deleting.');
        }

        $program->delete();

        return redirect()
            ->route('module.promotions.programs.index')
            ->with('success', 'Program deleted.');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncRelations(TradePromoProgram $program, array $data): void
    {
        $program->partners()->sync($data['partner_ids'] ?? []);
        $program->products()->sync($data['product_ids'] ?? []);

        $program->tiers()->delete();
        foreach ($data['tiers'] ?? [] as $index => $tier) {
            if (($tier['min_qty'] ?? null) === null
                && ($tier['min_value'] ?? null) === null
                && ($tier['discount_percent'] ?? null) === null
                && ($tier['free_qty'] ?? null) === null) {
                continue;
            }

            $program->tiers()->create([
                'sort_order' => $index + 1,
                'min_qty' => $tier['min_qty'] ?? null,
                'min_value' => $tier['min_value'] ?? null,
                'discount_percent' => $tier['discount_percent'] ?? null,
                'discount_amount' => $tier['discount_amount'] ?? null,
                'free_product_id' => $tier['free_product_id'] ?? null,
                'free_qty' => $tier['free_qty'] ?? null,
            ]);
        }

        if ($program->type === TradePromoProgram::TYPE_REBATE) {
            $program->rebateRule()->updateOrCreate([], [
                'rebate_percent' => $data['rebate_percent'] ?? null,
                'rebate_per_unit' => $data['rebate_per_unit'] ?? null,
                'calc_basis' => $data['calc_basis'] ?? 'qty',
            ]);
        } else {
            $program->rebateRule()?->delete();
        }
    }
}
