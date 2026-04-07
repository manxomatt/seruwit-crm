<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first() ?? User::factory()->create();

        Post::factory()
            ->count(5)
            ->for($user)
            ->published()
            ->create();

        Post::factory()
            ->count(3)
            ->for($user)
            ->draft()
            ->create();
    }
}
