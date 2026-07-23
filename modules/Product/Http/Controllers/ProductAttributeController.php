<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Http\Requests\StoreProductAttributeRequest;
use Modules\Product\Http\Requests\UpdateProductAttributeRequest;
use Modules\Product\Models\ProductAttribute;

class ProductAttributeController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $attributes = ProductAttribute::query()
            ->withCount('options')
            ->when(request('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('sort')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Product/Attributes/Index', [
            'attributes' => $attributes,
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
        return Inertia::render('Modules/Product/Attributes/Create');
    }

    public function store(StoreProductAttributeRequest $request): RedirectResponse
    {
        $attribute = ProductAttribute::create($request->safe()->only(['name', 'type', 'sort']));

        if ($request->has('options')) {
            foreach ($request->validated('options') as $option) {
                $attribute->options()->create($option);
            }
        }

        return redirect()->route($this->getRoutePrefix().'.products.attributes.index')
            ->with('success', 'Atribut berhasil dibuat.');
    }

    public function edit(ProductAttribute $attribute): Response
    {
        $attribute->load('options');

        return Inertia::render('Modules/Product/Attributes/Edit', [
            'attribute' => $attribute,
        ]);
    }

    public function update(UpdateProductAttributeRequest $request, ProductAttribute $attribute): RedirectResponse
    {
        $attribute->update($request->safe()->only(['name', 'type', 'sort']));

        if ($request->has('options')) {
            $keepIds = [];
            foreach ($request->validated('options') as $optionData) {
                if (! empty($optionData['id'])) {
                    $attribute->options()->where('id', $optionData['id'])->update($optionData);
                    $keepIds[] = $optionData['id'];
                } else {
                    $option = $attribute->options()->create($optionData);
                    $keepIds[] = $option->id;
                }
            }
            $attribute->options()->whereNotIn('id', $keepIds)->delete();
        }

        return redirect()->route($this->getRoutePrefix().'.products.attributes.index')
            ->with('success', 'Atribut berhasil diperbarui.');
    }

    public function destroy(ProductAttribute $attribute): RedirectResponse
    {
        $attribute->delete();

        return redirect()->route($this->getRoutePrefix().'.products.attributes.index')
            ->with('success', 'Atribut berhasil dihapus.');
    }
}
