<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Pages\Models\Page;
use Modules\Pages\Support\CentralLandingPageTemplate;

class CreateCentralLandingPageSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the modern Central Landing Page as data in the pages table
     * and set it as the default homepage.
     */
    public function run(): void
    {
        if (! class_exists(Page::class) || ! Schema::hasTable('pages')) {
            return;
        }

        $user = User::query()->first();

        if ($user === null) {
            return;
        }

        $userId = $user->id;

        $template = CentralLandingPageTemplate::build();

        // Unset is_homepage from any other pages to ensure single active homepage
        Page::query()->where('is_homepage', true)->update(['is_homepage' => false]);

        Page::query()->updateOrCreate(
            ['slug' => $template['slug']],
            [
                'user_id' => $userId,
                'title' => $template['title'],
                'html' => $template['html'],
                'css' => $template['css'],
                'gjs_data' => $template['gjs_data'],
                'is_published' => true,
                'is_homepage' => true,
            ]
        );
    }
}
