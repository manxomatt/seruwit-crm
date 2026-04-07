<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMediaRequest;
use App\Http\Requests\UpdateMediaRequest;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the media files.
     */
    public function index(Request $request): Response
    {
        $query = Auth::user()->media()->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('original_name', 'like', "%{$search}%")
                    ->orWhere('alt_text', 'like', "%{$search}%");
            });
        }

        $media = $query->paginate(24)->withQueryString()->through(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'original_name' => $item->original_name,
            'url' => $item->url,
            'mime_type' => $item->mime_type,
            'size' => $item->size,
            'human_size' => $item->human_size,
            'type' => $item->type,
            'alt_text' => $item->alt_text,
            'description' => $item->description,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ]);

        return Inertia::render('Modules/Media/Index', [
            'media' => $media,
            'filters' => [
                'type' => $request->input('type'),
                'search' => $request->input('search'),
            ],
        ]);
    }

    /**
     * Show the form for uploading new media.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Media/Create');
    }

    /**
     * Store a newly uploaded media file.
     */
    public function store(StoreMediaRequest $request): RedirectResponse
    {
        $file = $request->file('file');
        $disk = 'public';

        $path = $file->store('media', $disk);

        $mimeType = $file->getMimeType();
        $type = match (true) {
            str_starts_with($mimeType, 'image/') => 'image',
            str_starts_with($mimeType, 'video/') => 'video',
            default => 'document',
        };

        Auth::user()->media()->create([
            'name' => $file->hashName(),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'disk' => $disk,
            'mime_type' => $mimeType,
            'size' => $file->getSize(),
            'type' => $type,
            'alt_text' => $request->input('alt_text'),
            'description' => $request->input('description'),
        ]);

        return redirect()->route($this->getRoutePrefix().'.media.index')
            ->with('success', 'Media uploaded successfully.');
    }

    /**
     * Store multiple uploaded media files via AJAX.
     */
    public function upload(StoreMediaRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $disk = 'public';

        $path = $file->store('media', $disk);

        $mimeType = $file->getMimeType();
        $type = match (true) {
            str_starts_with($mimeType, 'image/') => 'image',
            str_starts_with($mimeType, 'video/') => 'video',
            default => 'document',
        };

        $media = Auth::user()->media()->create([
            'name' => $file->hashName(),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'disk' => $disk,
            'mime_type' => $mimeType,
            'size' => $file->getSize(),
            'type' => $type,
            'alt_text' => $request->input('alt_text'),
            'description' => $request->input('description'),
        ]);

        return response()->json([
            'success' => true,
            'media' => [
                'id' => $media->id,
                'name' => $media->name,
                'original_name' => $media->original_name,
                'url' => $media->url,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $media->human_size,
                'type' => $media->type,
            ],
        ]);
    }

    /**
     * Display the specified media file.
     */
    public function show(Media $medium): Response
    {
        if ($medium->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('Modules/Media/Show', [
            'media' => [
                'id' => $medium->id,
                'name' => $medium->name,
                'original_name' => $medium->original_name,
                'url' => $medium->url,
                'mime_type' => $medium->mime_type,
                'size' => $medium->size,
                'human_size' => $medium->human_size,
                'type' => $medium->type,
                'alt_text' => $medium->alt_text,
                'description' => $medium->description,
                'created_at' => $medium->created_at,
                'updated_at' => $medium->updated_at,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified media file.
     */
    public function edit(Media $medium): Response
    {
        if ($medium->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('Modules/Media/Edit', [
            'media' => [
                'id' => $medium->id,
                'name' => $medium->name,
                'original_name' => $medium->original_name,
                'url' => $medium->url,
                'mime_type' => $medium->mime_type,
                'size' => $medium->size,
                'human_size' => $medium->human_size,
                'type' => $medium->type,
                'alt_text' => $medium->alt_text,
                'description' => $medium->description,
            ],
        ]);
    }

    /**
     * Update the specified media file in storage.
     */
    public function update(UpdateMediaRequest $request, Media $medium): RedirectResponse
    {
        if ($medium->user_id !== Auth::id()) {
            abort(403);
        }

        $medium->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.media.index')
            ->with('success', 'Media updated successfully.');
    }

    /**
     * Remove the specified media file from storage.
     */
    public function destroy(Media $medium): RedirectResponse
    {
        if ($medium->user_id !== Auth::id()) {
            abort(403);
        }

        $medium->delete();

        return redirect()->route($this->getRoutePrefix().'.media.index')
            ->with('success', 'Media deleted successfully.');
    }

    /**
     * Bulk delete media files.
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:media,id'],
        ]);

        $media = Media::whereIn('id', $request->input('ids'))
            ->where('user_id', Auth::id())
            ->get();

        foreach ($media as $item) {
            $item->delete();
        }

        return redirect()->route($this->getRoutePrefix().'.media.index')
            ->with('success', count($media).' media files deleted successfully.');
    }

    /**
     * Get media files as JSON for media picker.
     */
    public function picker(Request $request): JsonResponse
    {
        $query = Auth::user()->media()->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('original_name', 'like', "%{$search}%")
                    ->orWhere('alt_text', 'like', "%{$search}%");
            });
        }

        $media = $query->paginate(24)->through(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'original_name' => $item->original_name,
            'url' => $item->url,
            'mime_type' => $item->mime_type,
            'size' => $item->size,
            'human_size' => $item->human_size,
            'type' => $item->type,
            'alt_text' => $item->alt_text,
        ]);

        return response()->json($media);
    }
}
