<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogTest extends TestCase
{
    use RefreshDatabase;

    public function test_blog_index_page_can_be_rendered(): void
    {
        $response = $this->get('/blog');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Blog/Index'));
    }

    public function test_blog_index_displays_published_posts(): void
    {
        $user = User::factory()->create();

        $publishedPost = Post::factory()
            ->for($user)
            ->published()
            ->create(['title' => 'Published Post Title']);

        $draftPost = Post::factory()
            ->for($user)
            ->draft()
            ->create(['title' => 'Draft Post Title']);

        $response = $this->get('/blog');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Blog/Index')
            ->has('posts.data', 1)
            ->where('posts.data.0.title', 'Published Post Title')
        );
    }

    public function test_blog_show_page_displays_published_post(): void
    {
        $user = User::factory()->create();

        $post = Post::factory()
            ->for($user)
            ->published()
            ->create([
                'title' => 'Test Blog Post',
                'slug' => 'test-blog-post',
            ]);

        $response = $this->get('/blog/test-blog-post');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Blog/Show')
            ->where('post.title', 'Test Blog Post')
            ->where('post.slug', 'test-blog-post')
        );
    }

    public function test_blog_show_returns_404_for_draft_post(): void
    {
        $user = User::factory()->create();

        $post = Post::factory()
            ->for($user)
            ->draft()
            ->create(['slug' => 'draft-post']);

        $response = $this->get('/blog/draft-post');

        $response->assertStatus(404);
    }

    public function test_blog_show_returns_404_for_nonexistent_post(): void
    {
        $response = $this->get('/blog/nonexistent-post');

        $response->assertStatus(404);
    }

    public function test_blog_index_paginates_posts(): void
    {
        $user = User::factory()->create();

        Post::factory()
            ->count(15)
            ->for($user)
            ->published()
            ->create();

        $response = $this->get('/blog');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Blog/Index')
            ->has('posts.data', 9)
            ->where('posts.last_page', 2)
        );
    }

    public function test_blog_show_includes_related_posts(): void
    {
        $user = User::factory()->create();

        $mainPost = Post::factory()
            ->for($user)
            ->published()
            ->create(['slug' => 'main-post']);

        Post::factory()
            ->count(5)
            ->for($user)
            ->published()
            ->create();

        $response = $this->get('/blog/main-post');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Blog/Show')
            ->has('relatedPosts', 3)
        );
    }
}
