<?php

namespace Tests\Feature;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoTest extends TestCase
{
    use RefreshDatabase;

    public function test_todos_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/todos');

        $response->assertOk();
    }

    public function test_todos_page_requires_authentication(): void
    {
        $response = $this->get('/todos');

        $response->assertRedirect('/login');
    }

    public function test_user_can_create_a_todo(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post('/todos', [
                'title' => 'Test Todo',
                'description' => 'Test Description',
            ]);

        $response->assertRedirect('/todos');

        $this->assertDatabaseHas('todos', [
            'user_id' => $user->id,
            'title' => 'Test Todo',
            'description' => 'Test Description',
            'is_completed' => false,
        ]);
    }

    public function test_todo_title_is_required(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->post('/todos', [
                'title' => '',
            ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_user_can_toggle_todo_completion(): void
    {
        $user = User::factory()->create();
        $todo = Todo::factory()->pending()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->patch("/todos/{$todo->id}", [
                'is_completed' => true,
            ]);

        $response->assertRedirect('/todos');

        $this->assertTrue($todo->fresh()->is_completed);
    }

    public function test_user_cannot_update_another_users_todo(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $otherUser->id]);

        $response = $this
            ->actingAs($user)
            ->patch("/todos/{$todo->id}", [
                'is_completed' => true,
            ]);

        $response->assertForbidden();
    }

    public function test_user_can_delete_their_todo(): void
    {
        $user = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id]);

        $response = $this
            ->actingAs($user)
            ->delete("/todos/{$todo->id}");

        $response->assertRedirect('/todos');

        $this->assertDatabaseMissing('todos', [
            'id' => $todo->id,
        ]);
    }

    public function test_user_cannot_delete_another_users_todo(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $otherUser->id]);

        $response = $this
            ->actingAs($user)
            ->delete("/todos/{$todo->id}");

        $response->assertForbidden();

        $this->assertDatabaseHas('todos', [
            'id' => $todo->id,
        ]);
    }

    public function test_user_only_sees_their_own_todos(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $userTodo = Todo::factory()->create(['user_id' => $user->id, 'title' => 'My Todo']);
        $otherTodo = Todo::factory()->create(['user_id' => $otherUser->id, 'title' => 'Other Todo']);

        $response = $this
            ->actingAs($user)
            ->get('/todos');

        $response->assertOk();
        $response->assertSee('My Todo');
        $response->assertDontSee('Other Todo');
    }
}
