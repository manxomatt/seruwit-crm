<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Http\Requests\StorePartnerTypeRequest;
use Modules\Partners\Http\Requests\UpdatePartnerTypeRequest;
use Modules\Partners\Models\PartnerType;

class PartnerTypeController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();
        $locale = app()->getLocale();
        $fallback = (string) config('localization.default', 'id');

        $types = PartnerType::query()
            ->withCount('partners')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name->id', 'ilike', "%{$search}%")
                        ->orWhere('name->en', 'ilike', "%{$search}%")
                        ->orWhere('description->id', 'ilike', "%{$search}%")
                        ->orWhere('description->en', 'ilike', "%{$search}%")
                        ->orWhere('code', 'ilike', "%{$search}%");
                });
            })
            ->when(request()->filled('active'), function ($query) {
                $query->where('is_active', request('active') === '1');
            })
            ->orderByRaw(
                "coalesce(nullif(name->>?, ''), nullif(name->>?, ''), nullif(name->>'id', ''), nullif(name->>'en', '')) asc",
                [$locale, $fallback],
            )
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Partners/Types/Index', [
            'types' => $types,
            'filters' => [
                'search' => request('search'),
                'active' => request('active'),
            ],
            'locales' => config('localization.supported', ['en', 'id']),
            'can' => [
                'create' => $user->hasPermissionFor('partners', 'create'),
                'update' => $user->hasPermissionFor('partners', 'update'),
                'delete' => $user->hasPermissionFor('partners', 'delete'),
            ],
        ]);
    }

    public function store(StorePartnerTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;
        $data['description'] = $data['description'] ?? null;
        $data['affects_customer_rank'] = $data['affects_customer_rank'] ?? false;
        $data['affects_supplier_rank'] = $data['affects_supplier_rank'] ?? false;

        PartnerType::query()->create($data);

        return redirect()->route($this->getRoutePrefix().'.partners.types.index')
            ->with('success', __('partners.messages.type_created'));
    }

    public function update(UpdatePartnerTypeRequest $request, PartnerType $type): RedirectResponse
    {
        $data = $request->validated();
        $data['description'] = $data['description'] ?? null;
        $data['affects_customer_rank'] = $data['affects_customer_rank'] ?? false;
        $data['affects_supplier_rank'] = $data['affects_supplier_rank'] ?? false;

        $type->update($data);

        return redirect()->route($this->getRoutePrefix().'.partners.types.index')
            ->with('success', __('partners.messages.type_updated'));
    }

    public function destroy(PartnerType $type): RedirectResponse
    {
        if ($type->partners()->exists()) {
            return back()->with('error', __('partners.messages.type_delete_referenced'));
        }

        $type->delete();

        return redirect()->route($this->getRoutePrefix().'.partners.types.index')
            ->with('success', __('partners.messages.type_deleted'));
    }
}
