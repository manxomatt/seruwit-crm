<?php

namespace Tests\Feature;

use App\Models\LiveUpdate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LiveUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_live_updates_page_is_displayed(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->get('/live-updates');

        $response->assertOk();
    }

    public function test_live_updates_page_requires_authentication(): void
    {
        $response = $this->get('/live-updates');

        $response->assertRedirect('/login');
    }

    public function test_user_can_create_a_live_update(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post('/live-updates', [
                'title' => 'Test Update',
                'content' => 'Test Content',
                'type' => 'info',
                'is_active' => true,
                'published_at' => now()->toDateTimeString(),
            ]);

        $response->assertRedirect('/live-updates');

        $this->assertDatabaseHas('live_updates', [
            'title' => 'Test Update',
            'content' => 'Test Content',
            'type' => 'info',
            'is_active' => true,
        ]);
    }

    public function test_live_update_title_is_required(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post('/live-updates', [
                'title' => '',
                'content' => 'Test Content',
                'type' => 'info',
            ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_live_update_content_is_required(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post('/live-updates', [
                'title' => 'Test Title',
                'content' => '',
                'type' => 'info',
            ]);

        $response->assertSessionHasErrors('content');
    }

    public function test_live_update_type_must_be_valid(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post('/live-updates', [
                'title' => 'Test Title',
                'content' => 'Test Content',
                'type' => 'invalid-type',
            ]);

        $response->assertSessionHasErrors('type');
    }

    public function test_user_can_update_a_live_update(): void
    {
        $user = User::factory()->admin()->create();
        $liveUpdate = LiveUpdate::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch("/live-updates/{$liveUpdate->id}", [
                'title' => 'Updated Title',
                'content' => 'Updated Content',
            ]);

        $response->assertRedirect('/live-updates');

        $this->assertDatabaseHas('live_updates', [
            'id' => $liveUpdate->id,
            'title' => 'Updated Title',
            'content' => 'Updated Content',
        ]);
    }

    public function test_user_can_delete_a_live_update(): void
    {
        $user = User::factory()->admin()->create();
        $liveUpdate = LiveUpdate::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete("/live-updates/{$liveUpdate->id}");

        $response->assertRedirect('/live-updates');

        $this->assertDatabaseMissing('live_updates', [
            'id' => $liveUpdate->id,
        ]);
    }

    public function test_only_active_and_published_updates_are_shown(): void
    {
        $user = User::factory()->admin()->create();

        $activePublished = LiveUpdate::factory()->create([
            'title' => 'Active Published',
            'is_active' => true,
            'published_at' => now()->subHour(),
        ]);

        $inactiveUpdate = LiveUpdate::factory()->inactive()->create([
            'title' => 'Inactive Update',
            'published_at' => now()->subHour(),
        ]);

        $unpublishedUpdate = LiveUpdate::factory()->unpublished()->create([
            'title' => 'Unpublished Update',
            'is_active' => true,
        ]);

        $scheduledUpdate = LiveUpdate::factory()->scheduled()->create([
            'title' => 'Scheduled Update',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/live-updates');

        $response->assertOk();
        $response->assertSee('Active Published');
        $response->assertDontSee('Inactive Update');
        $response->assertDontSee('Unpublished Update');
        $response->assertDontSee('Scheduled Update');
    }

    public function test_live_updates_are_ordered_by_published_date_descending(): void
    {
        $user = User::factory()->admin()->create();

        $olderUpdate = LiveUpdate::factory()->create([
            'title' => 'Older Update',
            'published_at' => now()->subDays(2),
        ]);

        $newerUpdate = LiveUpdate::factory()->create([
            'title' => 'Newer Update',
            'published_at' => now()->subDay(),
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/live-updates');

        $response->assertOk();
        $response->assertSeeInOrder(['Newer Update', 'Older Update']);
    }

    public function test_live_update_types_are_validated(): void
    {
        $user = User::factory()->admin()->create();

        foreach (['info', 'success', 'warning', 'error'] as $type) {
            $response = $this
                ->actingAs($user)
                ->post('/live-updates', [
                    'title' => "Test {$type}",
                    'content' => 'Test Content',
                    'type' => $type,
                    'published_at' => now()->toDateTimeString(),
                ]);

            $response->assertRedirect('/live-updates');

            $this->assertDatabaseHas('live_updates', [
                'title' => "Test {$type}",
                'type' => $type,
            ]);
        }
    }
}
