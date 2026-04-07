<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\Carousel;
use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    /**
     * Search across multiple models.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        /** @var User $user */
        $user = $request->user();
        $results = [];

        // Search Users
        if ($user->hasPermissionFor('users', 'view')) {
            $users = User::query()
                ->where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'title' => $user->name,
                    'subtitle' => $user->email,
                    'type' => 'user',
                    'icon' => 'user',
                    'url' => route('module.users.show', $user),
                ]);

            $results = array_merge($results, $users->toArray());
        }

        // Search Posts
        if ($user->hasPermissionFor('posts', 'view')) {
            $posts = Post::query()
                ->where('title', 'like', "%{$query}%")
                ->orWhere('excerpt', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'subtitle' => $post->is_published ? 'Published' : 'Draft',
                    'type' => 'post',
                    'icon' => 'post',
                    'url' => route('module.posts.show', $post),
                ]);

            $results = array_merge($results, $posts->toArray());
        }

        // Search Pages
        if ($user->hasPermissionFor('pages', 'view')) {
            $pages = Page::query()
                ->where('title', 'like', "%{$query}%")
                ->orWhere('slug', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Page $page) => [
                    'id' => $page->id,
                    'title' => $page->title,
                    'subtitle' => '/'.$page->slug,
                    'type' => 'page',
                    'icon' => 'page',
                    'url' => route('module.pages.show', $page),
                ]);

            $results = array_merge($results, $pages->toArray());
        }

        // Search Media
        if ($user->hasPermissionFor('media', 'view')) {
            $media = Media::query()
                ->where('name', 'like', "%{$query}%")
                ->orWhere('original_name', 'like', "%{$query}%")
                ->orWhere('alt_text', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Media $medium) => [
                    'id' => $medium->id,
                    'title' => $medium->name,
                    'subtitle' => $medium->type.' • '.$medium->human_size,
                    'type' => 'media',
                    'icon' => 'media',
                    'url' => route('module.media.show', $medium),
                    'thumbnail' => $medium->isImage() ? $medium->url : null,
                ]);

            $results = array_merge($results, $media->toArray());
        }

        // Search Carousels
        if ($user->hasPermissionFor('carousels', 'view')) {
            $carousels = Carousel::query()
                ->where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Carousel $carousel) => [
                    'id' => $carousel->id,
                    'title' => $carousel->name,
                    'subtitle' => $carousel->is_active ? 'Active' : 'Inactive',
                    'type' => 'carousel',
                    'icon' => 'carousel',
                    'url' => route('module.carousels.show', $carousel),
                ]);

            $results = array_merge($results, $carousels->toArray());
        }

        // Search Roles
        if ($user->hasPermissionFor('roles', 'view')) {
            $roles = Role::query()
                ->where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Role $role) => [
                    'id' => $role->id,
                    'title' => $role->name,
                    'subtitle' => $role->description ?? 'No description',
                    'type' => 'role',
                    'icon' => 'role',
                    'url' => route('module.roles.show', $role),
                ]);

            $results = array_merge($results, $roles->toArray());
        }

        // Search Settings
        if ($user->hasPermissionFor('settings', 'view')) {
            $settings = Setting::query()
                ->where('key', 'like', "%{$query}%")
                ->orWhere('label', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->orWhere('group', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Setting $setting) => [
                    'id' => $setting->id,
                    'title' => $setting->label ?? $setting->key,
                    'subtitle' => ucfirst($setting->group).' • '.$setting->key,
                    'type' => 'setting',
                    'icon' => 'setting',
                    'url' => route('module.settings.show', $setting),
                ]);

            $results = array_merge($results, $settings->toArray());
        }

        return response()->json([
            'results' => $results,
            'query' => $query,
        ]);
    }
}
