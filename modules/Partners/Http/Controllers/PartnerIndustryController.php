<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Http\Requests\StorePartnerIndustryRequest;
use Modules\Partners\Http\Requests\UpdatePartnerIndustryRequest;
use Modules\Partners\Models\PartnerIndustry;

class PartnerIndustryController extends Controller
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

        $industries = PartnerIndustry::query()
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

        return Inertia::render('Modules/Partners/Industries/Index', [
            'industries' => $industries,
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

    public function store(StorePartnerIndustryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;
        $data['description'] = $data['description'] ?? null;

        PartnerIndustry::query()->create($data);

        return redirect()->route($this->getRoutePrefix().'.partners.industries.index')
            ->with('success', __('partners.messages.industry_created'));
    }

    public function update(UpdatePartnerIndustryRequest $request, PartnerIndustry $industry): RedirectResponse
    {
        $data = $request->validated();
        $data['description'] = $data['description'] ?? null;

        $industry->update($data);

        return redirect()->route($this->getRoutePrefix().'.partners.industries.index')
            ->with('success', __('partners.messages.industry_updated'));
    }

    public function destroy(PartnerIndustry $industry): RedirectResponse
    {
        if ($industry->partners()->exists()) {
            return back()->with('error', __('partners.messages.industry_delete_referenced'));
        }

        $industry->delete();

        return redirect()->route($this->getRoutePrefix().'.partners.industries.index')
            ->with('success', __('partners.messages.industry_deleted'));
    }
}
