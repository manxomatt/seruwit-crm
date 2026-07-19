<?php

namespace Modules\Posts;

use App\Models\User;
use App\Modules\ModuleContract;
use App\Modules\ModuleTier;
use Illuminate\Support\Facades\Route;
use Modules\Posts\Http\Controllers\PostController;
use Modules\Posts\Models\Post;

/**
 * Blog posts published on the tenant's own public site. The public blog
 * routes (/blog, /blog/{slug}) stay in core — they exist whether or not this
 * module is installed — and gate themselves on Modules::available('posts').
 */
class PostsModule implements ModuleContract
{
    public function key(): string
    {
        return 'posts';
    }

    public function label(): string
    {
        return 'Posts';
    }

    public function description(): string
    {
        return 'Blog posts for the public site, with drafts and scheduled publishing.';
    }

    public function tier(): ModuleTier
    {
        return ModuleTier::Content;
    }

    public function permissions(): array
    {
        return ['view', 'create', 'update', 'delete'];
    }

    /**
     * Featured images are picked from the Media library, so Posts cannot
     * stand on its own without it.
     */
    public function requires(): array
    {
        return ['media'];
    }

    public function menu(): ?array
    {
        return [
            'name' => 'Posts',
            'slug' => 'posts',
            'icon' => 'posts',
            'route_name' => 'posts.index',
            'permission_module' => 'posts',
            'permission_action' => 'view',
            'sort_order' => 3,
        ];
    }

    public function migrationsPath(): string
    {
        return __DIR__.'/Database/Migrations';
    }

    public function viewsPath(): ?string
    {
        return null;
    }

    /**
     * Attaches the module's relation to the core User model, so that
     * App\Models\User needs no knowledge of Posts. Callers must still gate on
     * Modules::available('posts') — the relation is registered for every
     * process, but the table only exists where the module is installed.
     */
    public function boot(): void
    {
        User::resolveRelationUsing('posts', fn (User $user) => $user->hasMany(Post::class));
    }

    public function routes(): void
    {
        Route::get('/posts', [PostController::class, 'index'])->middleware('permission:posts,view')->name('posts.index');
        Route::get('/posts/create', [PostController::class, 'create'])->middleware('permission:posts,create')->name('posts.create');
        Route::post('/posts', [PostController::class, 'store'])->middleware('permission:posts,create')->name('posts.store');
        Route::get('/posts/{post}', [PostController::class, 'show'])->middleware('permission:posts,view')->name('posts.show');
        Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->middleware('permission:posts,update')->name('posts.edit');
        Route::patch('/posts/{post}', [PostController::class, 'update'])->middleware('permission:posts,update')->name('posts.update');
        Route::patch('/posts/{post}/toggle-publish', [PostController::class, 'togglePublish'])->middleware('permission:posts,update')->name('posts.toggle-publish');
        Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('permission:posts,delete')->name('posts.destroy');
    }
}
