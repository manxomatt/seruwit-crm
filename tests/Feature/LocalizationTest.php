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
                ->has('translations.bi')
                ->has('translations.bi.title')
                ->has('translations.billing')
                ->has('translations.billing.nav.charges')
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
                ->has('translations.maintenance')
                ->has('translations.maintenance.nav.work_orders')
                ->has('translations.orders')
                ->has('translations.orders.index.new')
                ->has('translations.outbound')
                ->has('translations.outbound.nav.pick_lists')
                ->has('translations.pages')
                ->has('translations.pages.index.create')
                ->has('translations.partners')
                ->has('translations.partners.index.new')
                ->has('translations.posts')
                ->has('translations.posts.index.create')
                ->has('translations.products')
                ->has('translations.products.nav.brands')
                ->has('translations.promotions')
                ->has('translations.promotions.nav.programs')
                ->has('translations.purchasing')
                ->has('translations.purchasing.nav.purchase_orders')
                ->has('translations.receivables')
                ->has('translations.receivables.nav.payments')
                ->has('translations.rental')
                ->has('translations.rental.pages.index.title')
                ->has('translations.routing')
                ->has('translations.routing.pages.index.title')
                ->has('translations.scoring')
                ->has('translations.scoring.nav.leaderboard')
                ->has('translations.tracking')
                ->has('translations.tracking.nav.map')
                ->has('translations.transportation')
                ->has('translations.transportation.nav.trips')
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
                ->where('translations.approvals.nav.inbox', 'Inbox')
                ->where('translations.approvals.policies.title', 'Approval Policies')
                ->where('translations.bi.title', 'Executive Dashboard')
                ->where('translations.bi.periods.today', 'Today')
                ->where('translations.billing.nav.allowances', 'Trip Allowance')
                ->where('translations.billing.tariffs.new', 'New Tariff')
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
                ->where('translations.maintenance.nav.work_orders', 'Work Orders')
                ->where('translations.maintenance.dashboard.new_wo', '+ New Work Order')
                ->where('translations.orders.index.new', 'New Order')
                ->where('translations.orders.driver.today.title', "Today's Tasks")
                ->where('translations.outbound.nav.pick_lists', 'Pick Lists')
                ->where('translations.outbound.actions.dispatch', 'Dispatch')
                ->where('translations.pages.index.create', 'Create Page')
                ->where('translations.pages.editor.save', 'Save')
                ->where('translations.partners.index.new', 'Add Partner')
                ->where('translations.partners.account_type.company', 'Company')
                ->where('translations.posts.index.create', 'Create Post')
                ->where('translations.posts.status.draft', 'Draft')
                ->where('translations.products.nav.brands', 'Brands')
                ->where('translations.products.products.index.new', 'Add Product')
                ->where('translations.promotions.nav.programs', 'Programs')
                ->where('translations.promotions.programs.index.new', 'New Program')
                ->where('translations.purchasing.nav.purchase_orders', 'Purchase Orders')
                ->where('translations.purchasing.purchase_orders.index.new', 'New PO')
                ->where('translations.receivables.nav.payments', 'Payments')
                ->where('translations.receivables.payments.index.record', 'Record Payment')
                ->where('translations.rental.pages.index.title', 'Vehicle Rentals')
                ->where('translations.rental.actions.new_rental', 'New Rental')
                ->where('translations.routing.pages.index.title', 'Route Plans')
                ->where('translations.routing.actions.new_plan', 'New Plan')
                ->where('translations.scoring.nav.leaderboard', 'Leaderboard')
                ->where('translations.scoring.actions.save_settings', 'Save settings')
                ->where('translations.tracking.nav.map', 'Live Map')
                ->where('translations.tracking.actions.sync', 'Sync from Traccar')
                ->where('translations.transportation.nav.trips', 'Trips')
                ->where('translations.transportation.actions.dispatch', 'Dispatch Trip')
            );

        $this->patch(route('locale.update'), ['locale' => 'id'])->assertRedirect();

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'id')
                ->where('translations.fleet.vehicles.title', 'Kendaraan')
                ->where('translations.fleet.nav.fuel', 'BBM')
                ->where('translations.approvals.nav.inbox', 'Kotak masuk')
                ->where('translations.approvals.policies.title', 'Kebijakan Persetujuan')
                ->where('translations.bi.title', 'Dashboard Eksekutif')
                ->where('translations.bi.periods.today', 'Hari ini')
                ->where('translations.billing.nav.allowances', 'Uang Jalan')
                ->where('translations.billing.tariffs.new', 'Tariff Baru')
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
                ->where('translations.maintenance.nav.work_orders', 'Work Orders')
                ->where('translations.maintenance.dashboard.new_wo', '+ Work Order Baru')
                ->where('translations.orders.index.new', 'Order Baru')
                ->where('translations.orders.driver.today.title', 'Tugas Hari Ini')
                ->where('translations.outbound.nav.pick_lists', 'Pick Lists')
                ->where('translations.outbound.actions.dispatch', 'Dispatch')
                ->where('translations.pages.index.create', 'Buat Halaman')
                ->where('translations.pages.editor.save', 'Simpan')
                ->where('translations.partners.index.new', 'Tambah Partner')
                ->where('translations.partners.account_type.company', 'Perusahaan')
                ->where('translations.posts.index.create', 'Buat Post')
                ->where('translations.posts.status.draft', 'Draft')
                ->where('translations.products.nav.brands', 'Brands')
                ->where('translations.products.products.index.new', 'Tambah Produk')
                ->where('translations.promotions.nav.programs', 'Program')
                ->where('translations.promotions.programs.index.new', 'Program Baru')
                ->where('translations.purchasing.nav.purchase_orders', 'Purchase Orders')
                ->where('translations.purchasing.purchase_orders.index.new', 'PO Baru')
                ->where('translations.receivables.nav.payments', 'Pembayaran')
                ->where('translations.receivables.payments.index.record', 'Rekam Pembayaran')
                ->where('translations.rental.pages.index.title', 'Rental Kendaraan')
                ->where('translations.rental.actions.new_rental', 'Rental Baru')
                ->where('translations.routing.pages.index.title', 'Rencana Rute')
                ->where('translations.routing.actions.new_plan', 'Rencana Baru')
                ->where('translations.scoring.nav.leaderboard', 'Leaderboard')
                ->where('translations.scoring.actions.save_settings', 'Simpan pengaturan')
                ->where('translations.tracking.nav.map', 'Live Map')
                ->where('translations.tracking.actions.sync', 'Sync dari Traccar')
                ->where('translations.transportation.nav.trips', 'Trip')
                ->where('translations.transportation.actions.dispatch', 'Dispatch Trip')
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
