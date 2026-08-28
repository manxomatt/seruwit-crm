<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Modules\Pages\Models\Page;
use Modules\Pages\Support\TenantPageTemplateRegistry;

class TenantDefaultPageSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a default modern landing page for the tenant and set it as homepage.
     */
    public function run(?string $vertical = 'rental'): void
    {
        if (! class_exists(Page::class) || ! \Illuminate\Support\Facades\Schema::hasTable('pages')) {
            return;
        }

        $existing = Page::query()->where('is_homepage', true)->first()
            ?? Page::query()->where('slug', 'beranda')->first()
            ?? Page::query()->where('slug', 'home')->first()
            ?? Page::query()->where('slug', 'home-page')->first();

        $template = TenantPageTemplateRegistry::resolve($vertical);

        if ($existing !== null) {
            $isEmptyContent = empty(trim((string) $existing->html))
                || trim((string) $existing->html) === '<body></body>'
                || strlen(trim((string) $existing->html)) < 50;

            $existing->update([
                'title' => $isEmptyContent ? $template['title'] : $existing->title,
                'html' => $isEmptyContent ? $template['html'] : $existing->html,
                'css' => $isEmptyContent ? $template['css'] : $existing->css,
                'gjs_data' => $isEmptyContent ? $template['gjs_data'] : $existing->gjs_data,
                'is_homepage' => true,
                'is_published' => true,
            ]);

            return;
        }

        // A landing page must belong to a real workspace user. During the tenant
        // seed step no user exists yet — the owner is synced in afterwards — so
        // skip here rather than attributing the page to a non-existent user id.
        // FinalizeTenantSetupJob and ProvisionSelfServeTenantJob re-run this seeder
        // once the owner is present, which is when the page actually gets created.
        $user = User::query()->first();

        if ($user === null) {
            return;
        }

        Page::query()->create([
            'user_id' => $user->id,
            'title' => $template['title'],
            'slug' => $template['slug'],
            'html' => $template['html'],
            'css' => $template['css'],
            'gjs_data' => $template['gjs_data'],
            'is_published' => true,
            'is_homepage' => true,
        ]);
    }
}
