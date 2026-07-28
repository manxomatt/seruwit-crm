<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_login_page_shares_locale_and_translations(): void
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->has('locale')
                ->has('translations.shell')
                ->has('translations.auth_ui')
                ->has('translations.fleet')
                ->has('translations.fleet.vehicles.title')
                ->has('translations.approvals')
                ->has('translations.approvals.nav.inbox')
                ->has('translations.analytics')
                ->has('translations.analytics.title')
                ->has('translations.central')
                ->has('translations.central.workspaces.title')
                ->has('translations.dashboard')
                ->has('translations.dashboard.title')
                ->has('translations.notifications')
                ->has('translations.notifications.title')
                ->has('translations.bi')
                ->has('translations.bi.title')
                ->has('translations.billing')
                ->has('translations.billing.nav.charges')
                ->has('translations.blog')
                ->has('translations.blog.index.hero_title')
                ->has('translations.canvassing')
                ->has('translations.canvassing.dashboard.title')
                ->has('translations.carousels')
                ->has('translations.carousels.title')
                ->has('translations.document')
                ->has('translations.document.title')
                ->has('translations.inventory')
                ->has('translations.inventory.nav.warehouses')
                ->has('translations.invoicing')
                ->has('translations.invoicing.nav.invoices')
                ->has('translations.landing')
                ->has('translations.landing.hero.title_highlight')
                ->has('translations.live_updates')
                ->has('translations.live_updates.title')
                ->has('translations.maintenance')
                ->has('translations.maintenance.nav.work_orders')
                ->has('translations.media')
                ->has('translations.media.pages.index.head')
                ->has('translations.orders')
                ->has('translations.orders.index.new')
                ->has('translations.outbound')
                ->has('translations.outbound.nav.pick_lists')
                ->has('translations.pages')
                ->has('translations.pages.index.create')
                ->has('translations.partners')
                ->has('translations.partners.index.new')
                ->has('translations.plans')
                ->has('translations.plans.pages.index.new')
                ->has('translations.platform')
                ->has('translations.platform.registry.title')
                ->has('translations.platform.modules_catalog.title')
                ->has('translations.posts')
                ->has('translations.posts.index.create')
                ->has('translations.products')
                ->has('translations.products.nav.brands')
                ->has('translations.promotions')
                ->has('translations.promotions.nav.programs')
                ->has('translations.purchasing')
                ->has('translations.purchasing.nav.purchase_orders')
                ->has('translations.sales')
                ->has('translations.sales.nav.sales_orders')
                ->has('translations.receivables')
                ->has('translations.receivables.nav.payments')
                ->has('translations.payables')
                ->has('translations.payables.nav.bills')
                ->has('translations.accounting')
                ->has('translations.accounting.nav.dashboard')
                ->has('translations.accounting.nav.bank')
                ->has('translations.rental')
                ->has('translations.rental.pages.index.title')
                ->has('translations.roles')
                ->has('translations.roles.pages.index.head')
                ->has('translations.routing')
                ->has('translations.routing.pages.index.title')
                ->has('translations.scoring')
                ->has('translations.scoring.nav.leaderboard')
                ->has('translations.settings')
                ->has('translations.settings.pages.index.head')
                ->has('translations.tenants')
                ->has('translations.tenants.pages.index.new')
                ->has('translations.todos')
                ->has('translations.todos.title')
                ->has('translations.tracking')
                ->has('translations.tracking.nav.map')
                ->has('translations.transportation')
                ->has('translations.transportation.nav.trips')
                ->has('translations.users')
                ->has('translations.users.pages.index.head')
                ->has('availableLocales', 2)
            );
    }

    public function test_fleet_translations_follow_selected_locale(): void
    {
        $this->patch(route('locale.update'), ['locale' => 'en'])->assertRedirect();

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'en')
                ->where('translations.fleet.vehicles.title', 'Vehicles')
                ->where('translations.fleet.nav.fuel', 'Fuel')
                ->where('translations.analytics.title', 'Analytics')
                ->where('translations.central.workspaces.title', 'Select Workspace')
                ->where('translations.dashboard.kpi.active_trips', 'Active trips')
                ->where('translations.notifications.title', 'Notifications')
                ->where('translations.approvals.nav.inbox', 'Inbox')
                ->where('translations.approvals.policies.title', 'Approval Policies')
                ->where('translations.bi.title', 'Executive Dashboard')
                ->where('translations.bi.periods.today', 'Today')
                ->where('translations.billing.nav.allowances', 'Trip Allowance')
                ->where('translations.billing.tariffs.new', 'New Tariff')
                ->where('translations.blog.nav.home', 'Home')
                ->where('translations.blog.index.hero_title', 'Blog & Articles')
                ->where('translations.canvassing.dashboard.title', 'Canvassing Dashboard')
                ->where('translations.canvassing.nav.today', 'Today')
                ->where('translations.carousels.title', 'Image Carousels')
                ->where('translations.carousels.create', 'Create New Carousel')
                ->where('translations.document.title', 'Documents')
                ->where('translations.document.nav.types', 'Document Types')
                ->where('translations.inventory.nav.warehouses', 'Warehouses')
                ->where('translations.inventory.opnames.new', 'New Opname')
                ->where('translations.invoicing.nav.invoices', 'Invoices')
                ->where('translations.invoicing.index.new', 'New Invoice')
                ->where('translations.landing.nav.features', 'Features')
                ->where('translations.landing.hero.title_highlight', 'Closer')
                ->where('translations.live_updates.title', 'Live Updates')
                ->where('translations.live_updates.actions.add', 'Create Update')
                ->where('translations.maintenance.nav.work_orders', 'Work Orders')
                ->where('translations.maintenance.dashboard.new_wo', '+ New Work Order')
                ->where('translations.media.pages.index.head', 'Media Library')
                ->where('translations.media.pages.index.upload', 'Upload Media')
                ->where('translations.orders.index.new', 'New Order')
                ->where('translations.orders.driver.today.title', "Today's Tasks")
                ->where('translations.outbound.nav.pick_lists', 'Pick Lists')
                ->where('translations.outbound.actions.dispatch', 'Dispatch')
                ->where('translations.pages.index.create', 'Create Page')
                ->where('translations.pages.editor.save', 'Save')
                ->where('translations.partners.index.new', 'Add Partner')
                ->where('translations.partners.account_type.company', 'Company')
                ->where('translations.plans.title', 'Plans')
                ->where('translations.plans.pages.index.new', 'Add Plan')
                ->where('translations.platform.registry.title', 'Platform Modules')
                ->where('translations.platform.modules_catalog.title', 'Modules')
                ->where('translations.posts.index.create', 'Create Post')
                ->where('translations.posts.status.draft', 'Draft')
                ->where('translations.products.nav.brands', 'Brands')
                ->where('translations.products.products.index.new', 'Add Product')
                ->where('translations.promotions.nav.programs', 'Programs')
                ->where('translations.promotions.programs.index.new', 'New Program')
                ->where('translations.purchasing.nav.purchase_orders', 'Purchase Orders')
                ->where('translations.purchasing.purchase_orders.index.new', 'New PO')
                ->where('translations.sales.nav.sales_orders', 'Sales Orders')
                ->where('translations.sales.sales_orders.index.new', 'New SO')
                ->where('translations.sales.title', 'Sales')
                ->where('translations.receivables.nav.payments', 'Payments')
                ->where('translations.receivables.payments.index.record', 'Record Payment')
                ->where('translations.rental.pages.index.title', 'Vehicle Rentals')
                ->where('translations.rental.actions.new_rental', 'New Rental')
                ->where('translations.roles.pages.index.head', 'Role Management')
                ->where('translations.roles.title', 'Roles')
                ->where('translations.routing.pages.index.title', 'Route Plans')
                ->where('translations.routing.actions.new_plan', 'New Plan')
                ->where('translations.scoring.nav.leaderboard', 'Leaderboard')
                ->where('translations.scoring.actions.save_settings', 'Save settings')
                ->where('translations.settings.pages.index.head', 'Settings')
                ->where('translations.settings.title', 'Settings')
                ->where('translations.tenants.title', 'Tenants')
                ->where('translations.tenants.pages.index.new', 'Create Tenant')
                ->where('translations.tenants.status.active', 'Active')
                ->where('translations.todos.title', 'To-Do List')
                ->where('translations.todos.actions.add', 'Add Todo')
                ->where('translations.tracking.nav.map', 'Live Map')
                ->where('translations.tracking.actions.sync', 'Sync from Traccar')
                ->where('translations.transportation.nav.trips', 'Trips')
                ->where('translations.transportation.actions.dispatch', 'Dispatch Trip')
                ->where('translations.users.pages.index.head', 'User Management')
                ->where('translations.users.title', 'Users')
                ->where('translations.modules.sales', 'Sales')
            );

        $this->patch(route('locale.update'), ['locale' => 'id'])->assertRedirect();

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'id')
                ->where('translations.fleet.vehicles.title', 'Kendaraan')
                ->where('translations.fleet.nav.fuel', 'BBM')
                ->where('translations.analytics.title', 'Analitik')
                ->where('translations.central.workspaces.title', 'Pilih Workspace')
                ->where('translations.dashboard.kpi.active_trips', 'Trip aktif')
                ->where('translations.notifications.title', 'Notifikasi')
                ->where('translations.approvals.nav.inbox', 'Kotak masuk')
                ->where('translations.approvals.policies.title', 'Kebijakan Persetujuan')
                ->where('translations.bi.title', 'Dashboard Eksekutif')
                ->where('translations.bi.periods.today', 'Hari ini')
                ->where('translations.billing.nav.allowances', 'Uang Jalan')
                ->where('translations.billing.tariffs.new', 'Tariff Baru')
                ->where('translations.blog.nav.home', 'Beranda')
                ->where('translations.blog.index.hero_title', 'Blog & Artikel')
                ->where('translations.canvassing.dashboard.title', 'Dashboard Canvassing')
                ->where('translations.canvassing.nav.today', 'Hari Ini')
                ->where('translations.carousels.title', 'Carousel Gambar')
                ->where('translations.carousels.create', 'Buat Carousel Baru')
                ->where('translations.document.title', 'Dokumen')
                ->where('translations.document.nav.types', 'Jenis Dokumen')
                ->where('translations.inventory.nav.warehouses', 'Gudang')
                ->where('translations.inventory.opnames.new', 'Opname Baru')
                ->where('translations.invoicing.nav.invoices', 'Invoice')
                ->where('translations.invoicing.index.new', 'Invoice Baru')
                ->where('translations.landing.nav.features', 'Fitur')
                ->where('translations.landing.hero.title_highlight', 'Lebih Dekat')
                ->where('translations.live_updates.title', 'Live Updates')
                ->where('translations.live_updates.actions.add', 'Buat Update')
                ->where('translations.maintenance.nav.work_orders', 'Work Orders')
                ->where('translations.maintenance.dashboard.new_wo', '+ Work Order Baru')
                ->where('translations.media.pages.index.head', 'Pustaka Media')
                ->where('translations.media.pages.index.upload', 'Unggah Media')
                ->where('translations.orders.index.new', 'Order Baru')
                ->where('translations.orders.driver.today.title', 'Tugas Hari Ini')
                ->where('translations.outbound.nav.pick_lists', 'Pick Lists')
                ->where('translations.outbound.actions.dispatch', 'Dispatch')
                ->where('translations.pages.index.create', 'Buat Halaman')
                ->where('translations.pages.editor.save', 'Simpan')
                ->where('translations.partners.index.new', 'Tambah Partner')
                ->where('translations.partners.account_type.company', 'Perusahaan')
                ->where('translations.plans.title', 'Paket')
                ->where('translations.plans.pages.index.new', 'Tambah Paket')
                ->where('translations.platform.registry.title', 'Modul Platform')
                ->where('translations.platform.modules_catalog.title', 'Modul')
                ->where('translations.posts.index.create', 'Buat Post')
                ->where('translations.posts.status.draft', 'Draft')
                ->where('translations.products.nav.brands', 'Brands')
                ->where('translations.products.products.index.new', 'Tambah Produk')
                ->where('translations.promotions.nav.programs', 'Program')
                ->where('translations.promotions.programs.index.new', 'Program Baru')
                ->where('translations.purchasing.nav.purchase_orders', 'Purchase Orders')
                ->where('translations.purchasing.purchase_orders.index.new', 'PO Baru')
                ->where('translations.sales.nav.sales_orders', 'Pesanan Penjualan')
                ->where('translations.sales.sales_orders.index.new', 'SO Baru')
                ->where('translations.sales.title', 'Penjualan')
                ->where('translations.modules.sales', 'Penjualan')
                ->where('translations.receivables.nav.payments', 'Pembayaran')
                ->where('translations.receivables.payments.index.record', 'Rekam Pembayaran')
                ->where('translations.rental.pages.index.title', 'Rental Kendaraan')
                ->where('translations.rental.actions.new_rental', 'Rental Baru')
                ->where('translations.roles.pages.index.head', 'Manajemen Peran')
                ->where('translations.roles.title', 'Peran')
                ->where('translations.routing.pages.index.title', 'Rencana Rute')
                ->where('translations.routing.actions.new_plan', 'Rencana Baru')
                ->where('translations.scoring.nav.leaderboard', 'Leaderboard')
                ->where('translations.scoring.actions.save_settings', 'Simpan pengaturan')
                ->where('translations.settings.pages.index.head', 'Pengaturan')
                ->where('translations.settings.title', 'Pengaturan')
                ->where('translations.tenants.title', 'Tenant')
                ->where('translations.tenants.pages.index.new', 'Buat Tenant')
                ->where('translations.tenants.status.active', 'Aktif')
                ->where('translations.todos.title', 'Daftar To-Do')
                ->where('translations.todos.actions.add', 'Tambah Todo')
                ->where('translations.tracking.nav.map', 'Live Map')
                ->where('translations.tracking.actions.sync', 'Sync dari Traccar')
                ->where('translations.transportation.nav.trips', 'Trip')
                ->where('translations.transportation.actions.dispatch', 'Dispatch Trip')
                ->where('translations.users.pages.index.head', 'Manajemen Pengguna')
                ->where('translations.users.title', 'Pengguna')
            );
    }

    public function test_guest_can_switch_locale_via_session(): void
    {
        $this->patch(route('locale.update'), ['locale' => 'en'])
            ->assertRedirect();

        $this->assertSame('en', session('locale'));

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'en')
                ->where('translations.shell.log_out', 'Log Out')
            );
    }

    public function test_authenticated_user_locale_is_persisted(): void
    {
        $user = $this->createAdminUser(['locale' => 'id']);

        $this->actingAs($user)
            ->patch(route('locale.update'), ['locale' => 'en'])
            ->assertRedirect();

        $this->assertSame('en', $user->fresh()->locale);
        $this->assertSame('en', session('locale'));
        $this->assertSame('en', App::getLocale());
    }

    public function test_unsupported_locale_is_rejected(): void
    {
        $this->patch(route('locale.update'), ['locale' => 'fr'])
            ->assertSessionHasErrors('locale');
    }

    public function test_profile_update_can_change_locale(): void
    {
        $user = $this->createAdminUser(['locale' => 'id']);

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => $user->name,
                'email' => $user->email,
                'locale' => 'en',
            ])
            ->assertRedirect(route('profile.edit'));

        $this->assertSame('en', $user->fresh()->locale);
    }

    public function test_module_dashboard_uses_user_locale(): void
    {
        $user = $this->createAdminUser(['locale' => 'en']);

        $this->actingAs($user)
            ->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'en')
                ->where('translations.modules.fleet', 'Fleet')
            );
    }
}
