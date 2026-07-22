<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StoreBrandRequest;
use Modules\Product\Http\Requests\UpdateBrandRequest;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;

class BrandController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $brands = Brand::query()
            ->with('principal:id,name')
            ->withCount('products')
            ->when(request('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when(request('principal_id'), fn ($q, $id) => $q->where('principal_id', $id))
            ->when(request('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $principals = Principal::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Modules/Product/Brands/Index', [
            'brands' => $brands,
            'principals' => $principals,
            'filters' => [
                'search' => request('search'),
                'principal_id' => request('principal_id'),
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
        $principals = Principal::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Modules/Product/Brands/Create', [
            'principals' => $principals,
        ]);
    }

    public function store(StoreBrandRequest $request): RedirectResponse
    {
        Brand::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.brands.index')
            ->with('success', 'Brand berhasil dibuat.');
    }

    public function edit(Brand $brand): Response
    {
        $principals = Principal::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Modules/Product/Brands/Edit', [
            'brand' => $brand->load('principal:id,name'),
            'principals' => $principals,
        ]);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $brand->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.brands.index')
            ->with('success', 'Brand berhasil diperbarui.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        if ($brand->products()->exists()) {
            return back()->with('error', 'Brand masih memiliki produk dan tidak bisa dihapus.');
        }

        $brand->delete();

        return redirect()->route($this->getRoutePrefix().'.products.brands.index')
            ->with('success', 'Brand berhasil dihapus.');
    }
}
