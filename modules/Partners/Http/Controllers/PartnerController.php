<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Http\Requests\StorePartnerRequest;
use Modules\Partners\Http\Requests\UpdatePartnerRequest;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Modules\Partners\Models\PartnerTag;
use Modules\Partners\Models\PartnerTitle;

class PartnerController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $partners = Partner::query()
            ->with('industry', 'tags')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ilike', "%{$search}%")
                        ->orWhere('code', 'ilike', "%{$search}%")
                        ->orWhere('phone', 'ilike', "%{$search}%")
                        ->orWhere('mobile', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('tax_id', 'ilike', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->when(request('account_type'), fn ($query, $type) => $query->where('account_type', $type))
            ->when(request('role'), function ($query, $role) {
                if ($role === 'customer') {
                    $query->where('customer_rank', '>', 0);
                } elseif ($role === 'supplier') {
                    $query->where('supplier_rank', '>', 0);
                }
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Partners/Index', [
            'partners' => $partners,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'account_type' => request('account_type'),
                'role' => request('role'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('partners', 'create'),
                'update' => $user->hasPermissionFor('partners', 'update'),
                'delete' => $user->hasPermissionFor('partners', 'delete'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Partners/Create', [
            'industries' => PartnerIndustry::query()->where('is_active', true)->orderBy('name')->get(),
            'titles' => PartnerTitle::query()->orderBy('name')->get(),
            'tags' => PartnerTag::query()->orderBy('name')->get(),
            'partners' => Partner::query()->where('account_type', 'company')->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StorePartnerRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        $validated['customer_rank'] = ($validated['is_customer'] ?? false) ? 1 : 0;
        $validated['supplier_rank'] = ($validated['is_supplier'] ?? false) ? 1 : 0;
        unset($validated['is_customer'], $validated['is_supplier']);

        $partner = Partner::create([
            ...$validated,
            'code' => Partner::nextCode(),
        ]);

        if ($tagIds) {
            $partner->tags()->sync($tagIds);
        }

        return redirect()->route($this->getRoutePrefix().'.partners.show', $partner)
            ->with('success', 'Partner berhasil dibuat.');
    }

    public function show(Partner $partner): Response
    {
        $user = Auth::user();

        $partner->load([
            'industry',
            'title',
            'tags',
            'parent',
            'children',
            'addresses',
            'bankAccounts',
        ]);

        return Inertia::render('Modules/Partners/Show', [
            'partner' => $partner,
            'can' => [
                'update' => $user->hasPermissionFor('partners', 'update'),
                'delete' => $user->hasPermissionFor('partners', 'delete'),
            ],
        ]);
    }

    public function edit(Partner $partner): Response
    {
        $partner->load('tags');

        return Inertia::render('Modules/Partners/Edit', [
            'partner' => $partner,
            'industries' => PartnerIndustry::query()->where('is_active', true)->orderBy('name')->get(),
            'titles' => PartnerTitle::query()->orderBy('name')->get(),
            'tags' => PartnerTag::query()->orderBy('name')->get(),
            'partners' => Partner::query()
                ->where('account_type', 'company')
                ->where('id', '!=', $partner->id)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
    }

    public function update(UpdatePartnerRequest $request, Partner $partner): RedirectResponse
    {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        if (array_key_exists('is_customer', $validated)) {
            $validated['customer_rank'] = $validated['is_customer'] ? max(1, $partner->customer_rank) : 0;
            unset($validated['is_customer']);
        }

        if (array_key_exists('is_supplier', $validated)) {
            $validated['supplier_rank'] = $validated['is_supplier'] ? max(1, $partner->supplier_rank) : 0;
            unset($validated['is_supplier']);
        }

        $partner->update($validated);

        if ($tagIds !== null) {
            $partner->tags()->sync($tagIds);
        }

        return redirect()->route($this->getRoutePrefix().'.partners.show', $partner)
            ->with('success', 'Partner berhasil diperbarui.');
    }

    public function destroy(Partner $partner): RedirectResponse
    {
        try {
            DB::transaction(fn () => $partner->delete());
        } catch (QueryException) {
            return back()->with('error', 'Partner ini masih direferensikan oleh data lain dan tidak dapat dihapus.');
        }

        return redirect()->route($this->getRoutePrefix().'.partners.index')
            ->with('success', 'Partner berhasil dihapus.');
    }
}
