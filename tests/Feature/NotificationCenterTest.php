<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_notifying_a_user_stores_a_database_notification(): void
    {
        $user = $this->createAdminUser();

        $user->notify(new GenericNotification('STNK habis', 'Truk A dalam 7 hari', '/x', 'bell', 'warning'));

        $this->assertSame(1, $user->notifications()->count());
        $this->assertSame('STNK habis', $user->notifications()->first()->data['title']);
    }

    public function test_the_index_lists_the_users_notifications(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Halo', 'isi'));

        $this->actingAs($user)->get(route('module.notifications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Notifications/Index')
                ->has('notifications.data', 1)
            );
    }

    public function test_a_notification_can_be_marked_read(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Halo', 'isi'));
        $id = $user->notifications()->first()->id;

        $this->actingAs($user)->post(route('module.notifications.read', $id));

        $this->assertNotNull($user->notifications()->first()->read_at);
    }

    public function test_all_notifications_can_be_marked_read(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('a', 'x'));
        $user->notify(new GenericNotification('b', 'y'));

        $this->actingAs($user)->post(route('module.notifications.read-all'));

        $this->assertSame(0, $user->unreadNotifications()->count());
    }

    public function test_the_unread_count_is_shared_to_every_page(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('a', 'x'));

        $this->actingAs($user)->get(route('module.notifications.index'))
            ->assertInertia(fn ($page) => $page->where('notificationCenter.unread_count', 1));
    }

    public function test_recipients_resolve_to_admins_and_permission_holders(): void
    {
        $admin = $this->createAdminUser();

        // A user whose custom role carries exactly document.view.
        $viewer = $this->createUserWithoutRole();
        $role = Role::create(['name' => 'Doc Viewer', 'slug' => 'doc-viewer']);
        $role->permissions()->attach(Permission::where('module', 'document')->where('action', 'view')->firstOrFail());
        $viewer->roles()->attach($role);

        // A user with an unrelated permission gets nothing.
        $outsider = $this->createUserWithoutRole();
        $otherRole = Role::create(['name' => 'Product Viewer', 'slug' => 'product-viewer']);
        $otherRole->permissions()->attach(Permission::where('module', 'products')->where('action', 'view')->firstOrFail());
        $outsider->roles()->attach($otherRole);

        $ids = NotificationRecipients::forPermission('document', 'view')->pluck('id');

        $this->assertTrue($ids->contains($admin->id));
        $this->assertTrue($ids->contains($viewer->id));
        $this->assertFalse($ids->contains($outsider->id));
    }
}
