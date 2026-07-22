<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StorePrincipalRequest;
use Modules\Product\Http\Requests\UpdatePrincipalRequest;
use Modules\Product\Models\Principal;

class PrincipalController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $principals = Principal::query()
            ->withCount('brands')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Product/Principals/Index', [
            'principals' => $principals,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('products', 'create'),
                'update' => $user->hasPermissionFor('products', 'update'),
                'delete' => $user->hasPermissionFor('products', 'delete'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Product/Principals/Create');
    }

    public function store(StorePrincipalRequest $request): RedirectResponse
    {
        $principal = Principal::create([
            ...$request->validated(),
            'code' => Principal::nextCode(),
        ]);

        return redirect()->route($this->getRoutePrefix().'.products.principals.index')
            ->with('success', 'Principal berhasil dibuat.');
    }

    public function edit(Principal $principal): Response
    {
        return Inertia::render('Modules/Product/Principals/Edit', [
            'principal' => $principal,
        ]);
    }

    public function update(UpdatePrincipalRequest $request, Principal $principal): RedirectResponse
    {
        $principal->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.principals.index')
            ->with('success', 'Principal berhasil diperbarui.');
    }

    public function destroy(Principal $principal): RedirectResponse
    {
        if ($principal->brands()->exists()) {
            return back()->with('error', 'Principal masih memiliki brand dan tidak bisa dihapus.');
        }

        $principal->delete();

        return redirect()->route($this->getRoutePrefix().'.products.principals.index')
            ->with('success', 'Principal berhasil dihapus.');
    }
}
