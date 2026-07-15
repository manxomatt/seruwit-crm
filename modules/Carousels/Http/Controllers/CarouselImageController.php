<?php

namespace Modules\Carousels\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Modules\Carousels\Http\Requests\StoreCarouselImageRequest;
use Modules\Carousels\Http\Requests\UpdateCarouselImageRequest;
use Modules\Carousels\Models\Carousel;
use Modules\Carousels\Models\CarouselImage;

class CarouselImageController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Store a newly created carousel image in storage.
     */
    public function store(StoreCarouselImageRequest $request, Carousel $carousel): RedirectResponse
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('carousels', 'public');
        } elseif ($request->filled('image_url')) {
            $imagePath = $request->validated('image_url');
        }

        $maxSortOrder = $carousel->images()->max('sort_order') ?? -1;

        $carousel->images()->create([
            'image_path' => $imagePath,
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'link_url' => $request->validated('link_url'),
            'link_target' => $request->validated('link_target', '_self'),
            'button_text' => $request->validated('button_text'),
            'sort_order' => $maxSortOrder + 1,
            'is_active' => $request->validated('is_active', true),
        ]);

        return redirect()->route($this->getRoutePrefix().'.carousels.edit', $carousel)
            ->with('success', 'Image added successfully.');
    }

    /**
     * Update the specified carousel image in storage.
     */
    public function update(UpdateCarouselImageRequest $request, Carousel $carousel, CarouselImage $image): RedirectResponse
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        if ($image->carousel_id !== $carousel->id) {
            abort(404);
        }

        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image if it's a local file
            if ($image->image_path && ! str_starts_with($image->image_path, 'http')) {
                Storage::disk('public')->delete($image->image_path);
            }
            $data['image_path'] = $request->file('image')->store('carousels', 'public');
        } elseif ($request->filled('image_url')) {
            // Delete old image if it's a local file
            if ($image->image_path && ! str_starts_with($image->image_path, 'http')) {
                Storage::disk('public')->delete($image->image_path);
            }
            $data['image_path'] = $request->validated('image_url');
        }

        unset($data['image'], $data['image_url']);
        $image->update($data);

        return redirect()->route($this->getRoutePrefix().'.carousels.edit', $carousel)
            ->with('success', 'Image updated successfully.');
    }

    /**
     * Remove the specified carousel image from storage.
     */
    public function destroy(Carousel $carousel, CarouselImage $image): RedirectResponse
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        if ($image->carousel_id !== $carousel->id) {
            abort(404);
        }

        // Delete the image file only if it's a local file
        if ($image->image_path && ! str_starts_with($image->image_path, 'http')) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        return redirect()->route($this->getRoutePrefix().'.carousels.edit', $carousel)
            ->with('success', 'Image deleted successfully.');
    }

    /**
     * Reorder carousel images.
     */
    public function reorder(Request $request, Carousel $carousel): JsonResponse
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'images' => ['required', 'array'],
            'images.*.id' => ['required', 'integer', 'exists:carousel_images,id'],
            'images.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->input('images') as $imageData) {
            CarouselImage::query()
                ->where('id', $imageData['id'])
                ->where('carousel_id', $carousel->id)
                ->update(['sort_order' => $imageData['sort_order']]);
        }

        return response()->json(['success' => true, 'message' => 'Images reordered successfully.']);
    }
}
