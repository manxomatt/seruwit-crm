<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Pages\Models\Page;
use Modules\Pages\Support\CentralLandingPageBrightTemplate;

class CreateCentralLandingPageBrightSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the bright & soft Landing Page variant into the pages table.
     */
    public function run(): void
    {
        if (! class_exists(Page::class) || ! Schema::hasTable('pages')) {
            return;
        }

        $user = User::query()->first();
        $userId = $user?->id ?? 1;

        $template = CentralLandingPageBrightTemplate::build();

        Page::query()->updateOrCreate(
            ['slug' => $template['slug']],
            [
                'user_id' => $userId,
                'title' => $template['title'],
                'html' => $template['html'],
                'css' => $template['css'],
                'gjs_data' => $template['gjs_data'],
                'is_published' => true,
                'is_homepage' => false,
            ]
        );
    }
}
