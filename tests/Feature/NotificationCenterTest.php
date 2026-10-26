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

    public function test_a_notification_can_be_marked_unread(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Test Title', 'Test Body'));
        $notification = $user->notifications()->first();
        $notification->markAsRead();
        $this->assertNotNull($notification->fresh()->read_at);

        $this->actingAs($user)->post(route('module.notifications.unread', $notification->id));
        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_a_notification_can_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Title 1', 'Body 1'));
        $user->notify(new GenericNotification('Title 2', 'Body 2'));
        $notification = $user->notifications()->first();

        $this->actingAs($user)->delete(route('module.notifications.destroy', $notification->id));
        $this->assertSame(1, $user->notifications()->count());
    }

    public function test_all_notifications_can_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Title 1', 'Body 1'));
        $user->notify(new GenericNotification('Title 2', 'Body 2'));

        $this->actingAs($user)->delete(route('module.notifications.destroy-all'));
        $this->assertSame(0, $user->notifications()->count());
    }

    public function test_notifications_can_be_filtered_by_tab_and_search(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Invoice Overdue', 'Invoice #101 is overdue'));
        $user->notify(new GenericNotification('GPS Overspeed', 'Vehicle B overspeed'));
        $user->notifications()->first()->markAsRead();

        $this->actingAs($user)
            ->get(route('module.notifications.index', ['tab' => 'unread']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Notifications/Index')
                ->has('notifications.data', 1)
                ->where('counts.unread', 1)
                ->where('counts.total', 2)
            );

        $this->actingAs($user)
            ->get(route('module.notifications.index', ['search' => 'Invoice']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Notifications/Index')
                ->has('notifications.data', 1)
            );
    }

    public function test_opening_a_notification_marks_it_as_read_and_redirects_to_target_url(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Dokumen Segera Berakhir', 'STNK Truk', 'http://localhost.test:8000/module/documents'));
        $notification = $user->notifications()->first();

        $this->assertNull($notification->read_at);

        $response = $this->actingAs($user)->get(route('module.notifications.open', $notification->id));

        $response->assertRedirect('/module/documents');
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_opening_a_notification_without_url_marks_it_as_read_and_redirects_to_index(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Info Sistem', 'Pemberitahuan tanpa link', null));
        $notification = $user->notifications()->first();

        $this->assertNull($notification->read_at);

        $response = $this->actingAs($user)->get(route('module.notifications.open', $notification->id));

        $response->assertRedirect(route('module.notifications.index'));
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_notifications_index_normalizes_url(): void
    {
        $user = $this->createAdminUser();
        $user->notify(new GenericNotification('Payment Order', 'Bukti transfer', 'http://localhost.test:8000/module/payment-orders/1'));

        $this->actingAs($user)
            ->get(route('module.notifications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Notifications/Index')
                ->where('notifications.data.0.url', '/module/payment-orders/1')
            );
    }
}
