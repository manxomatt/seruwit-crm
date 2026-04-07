<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\MediaController as AdminMediaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends AdminMediaController
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    protected function getPagePrefix(): string
    {
        return 'Module';
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

        $user = Auth::user();

        return Inertia::render('Modules/Media/Index', [
            'media' => $media,
            'filters' => [
                'type' => $request->input('type'),
                'search' => $request->input('search'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('media', 'create'),
                'update' => $user->hasPermissionFor('media', 'update'),
                'delete' => $user->hasPermissionFor('media', 'delete'),
            ],
        ]);
    }
}
