<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StoreProductTagRequest;
use Modules\Product\Http\Requests\UpdateProductTagRequest;
use Modules\Product\Models\ProductTag;

class ProductTagController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $tags = ProductTag::query()
            ->withCount('products')
            ->when(request('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Product/Tags/Index', [
            'tags' => $tags,
            'filters' => [
                'search' => request('search'),
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
        return Inertia::render('Modules/Product/Tags/Create');
    }

    public function store(StoreProductTagRequest $request): RedirectResponse
    {
        ProductTag::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.tags.index')
            ->with('success', 'Tag berhasil dibuat.');
    }

    public function edit(ProductTag $tag): Response
    {
        return Inertia::render('Modules/Product/Tags/Edit', [
            'tag' => $tag,
        ]);
    }

    public function update(UpdateProductTagRequest $request, ProductTag $tag): RedirectResponse
    {
        $tag->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.products.tags.index')
            ->with('success', 'Tag berhasil diperbarui.');
    }

    public function destroy(ProductTag $tag): RedirectResponse
    {
        if ($tag->products()->exists()) {
            return back()->with('error', 'Tag masih digunakan oleh produk dan tidak bisa dihapus.');
        }

        $tag->delete();

        return redirect()->route($this->getRoutePrefix().'.products.tags.index')
            ->with('success', 'Tag berhasil dihapus.');
    }
}
