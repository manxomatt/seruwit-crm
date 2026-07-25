<?php

namespace App\Services;

use App\Models\Media;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Modules\Facades\Modules;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Modules\Approvals\Models\ApprovalRequest;
use Modules\Billing\Models\Tariff;
use Modules\Billing\Models\TripAllowance;
use Modules\Canvassing\Models\Salesperson;
use Modules\Carousels\Models\Carousel;
use Modules\Document\Models\Document;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Inventory\Models\Warehouse;
use Modules\Invoicing\Models\Invoice;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Outbound\Models\PickList;
use Modules\Pages\Models\Page;
use Modules\Partners\Models\Partner;
use Modules\Posts\Models\Post;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductAttribute;
use Modules\Product\Models\ProductTag;
use Modules\Product\Models\ProductType;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Receivables\Models\Payment;
use Modules\Rental\Models\Rental;
use Modules\Routing\Models\RoutePlan;
use Modules\Tracking\Models\GpsDevice;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripSchedule;

/**
 * Aggregates global search hits across core features and every installed module
 * the current user is allowed to view.
 */
class GlobalSearchService
{
    private const LIMIT = 5;

    /**
     * @return list<array{id: int|string, title: string, subtitle: string, type: string, icon: string, url: string, thumbnail?: string|null}>
     */
    public function search(User $user, string $query): array
    {
        if (strlen($query) < 2) {
            return [];
        }

        $results = [];

        foreach ($this->providers() as $provider) {
            $results = array_merge($results, $provider($user, $query));
        }

        return $results;
    }

    /**
     * @return list<\Closure(User, string): list<array<string, mixed>>>
     */
    private function providers(): array
    {
        return [
            $this->users(...),
            $this->roles(...),
            $this->settings(...),
            $this->media(...),
            $this->posts(...),
            $this->pages(...),
            $this->carousels(...),
            $this->partners(...),
            $this->products(...),
            $this->principals(...),
            $this->brands(...),
            $this->productTypes(...),
            $this->productAttributes(...),
            $this->productTags(...),
            $this->vehicles(...),
            $this->drivers(...),
            $this->orders(...),
            $this->trips(...),
            $this->tripSchedules(...),
            $this->invoices(...),
            $this->purchaseOrders(...),
            $this->grns(...),
            $this->payments(...),
            $this->warehouses(...),
            $this->workOrders(...),
            $this->pickLists(...),
            $this->rentals(...),
            $this->salespeople(...),
            $this->routePlans(...),
            $this->approvalRequests(...),
            $this->promoPrograms(...),
            $this->tariffs(...),
            $this->tripAllowances(...),
            $this->documents(...),
            $this->gpsDevices(...),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function users(User $user, string $query): array
    {
        if (! $user->hasPermissionFor('users', 'view')) {
            return [];
        }

        return User::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('email', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (User $match) => [
                'id' => $match->id,
                'title' => $match->name,
                'subtitle' => $match->email,
                'type' => 'user',
                'icon' => 'user',
                'url' => route('module.users.show', $match),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function roles(User $user, string $query): array
    {
        if (! $user->hasPermissionFor('roles', 'view')) {
            return [];
        }

        return Role::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('description', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'title' => $role->name,
                'subtitle' => $role->description ?? __('shell.search.no_description'),
                'type' => 'role',
                'icon' => 'role',
                'url' => route('module.roles.show', $role),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function settings(User $user, string $query): array
    {
        if (! $user->hasPermissionFor('settings', 'view')) {
            return [];
        }

        return Setting::query()
            ->where(fn (Builder $q) => $q
                ->where('key', 'ilike', "%{$query}%")
                ->orWhere('label', 'ilike', "%{$query}%")
                ->orWhere('description', 'ilike', "%{$query}%")
                ->orWhere('group', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Setting $setting) => [
                'id' => $setting->id,
                'title' => $setting->label ?? $setting->key,
                'subtitle' => ucfirst($setting->group).' • '.$setting->key,
                'type' => 'setting',
                'icon' => 'setting',
                'url' => route('module.settings.group', $setting->group),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function media(User $user, string $query): array
    {
        if (! $user->hasPermissionFor('media', 'view')) {
            return [];
        }

        return Media::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('original_name', 'ilike', "%{$query}%")
                ->orWhere('alt_text', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Media $medium) => [
                'id' => $medium->id,
                'title' => $medium->name,
                'subtitle' => $medium->type.' • '.$medium->human_size,
                'type' => 'media',
                'icon' => 'media',
                'url' => route('module.media.show', $medium),
                'thumbnail' => $medium->isImage() ? $medium->url : null,
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function posts(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'posts', Post::class, 'posts')) {
            return [];
        }

        return Post::query()
            ->where(fn (Builder $q) => $q
                ->where('title', 'ilike', "%{$query}%")
                ->orWhere('excerpt', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->is_published ? __('shell.search.published') : __('shell.search.draft'),
                'type' => 'post',
                'icon' => 'post',
                'url' => route('module.posts.show', $post),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function pages(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'pages', Page::class, 'pages')) {
            return [];
        }

        return Page::query()
            ->where(fn (Builder $q) => $q
                ->where('title', 'ilike', "%{$query}%")
                ->orWhere('slug', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Page $page) => [
                'id' => $page->id,
                'title' => $page->title,
                'subtitle' => '/'.$page->slug,
                'type' => 'page',
                'icon' => 'page',
                'url' => route('module.pages.show', $page),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function carousels(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'carousels', Carousel::class, 'carousels')) {
            return [];
        }

        return Carousel::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('description', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Carousel $carousel) => [
                'id' => $carousel->id,
                'title' => $carousel->name,
                'subtitle' => $carousel->is_active ? __('shell.search.active') : __('shell.search.inactive'),
                'type' => 'carousel',
                'icon' => 'carousel',
                'url' => route('module.carousels.show', $carousel),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function partners(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'partners', Partner::class, 'partners')) {
            return [];
        }

        return Partner::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('code', 'ilike', "%{$query}%")
                ->orWhere('phone', 'ilike', "%{$query}%")
                ->orWhere('mobile', 'ilike', "%{$query}%")
                ->orWhere('email', 'ilike', "%{$query}%")
                ->orWhere('tax_id', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Partner $partner) => [
                'id' => $partner->id,
                'title' => $partner->name,
                'subtitle' => $partner->code.($partner->email ? ' • '.$partner->email : ''),
                'type' => 'partner',
                'icon' => 'partner',
                'url' => route('module.partners.show', $partner),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function products(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'products', Product::class, 'products')) {
            return [];
        }

        return Product::query()
            ->whereNull('parent_id')
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('code', 'ilike', "%{$query}%")
                ->orWhere('sku', 'ilike', "%{$query}%")
                ->orWhere('barcode', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'title' => $product->name,
                'subtitle' => collect([$product->code, $product->sku])->filter()->implode(' • '),
                'type' => 'product',
                'icon' => 'product',
                'url' => route('module.products.show', $product),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function principals(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'products', Principal::class, 'principals')) {
            return [];
        }

        return Principal::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('code', 'ilike', "%{$query}%")
                ->orWhere('contact_person', 'ilike', "%{$query}%")
                ->orWhere('email', 'ilike', "%{$query}%")
                ->orWhere('phone', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Principal $principal) => [
                'id' => $principal->id,
                'title' => $principal->name,
                'subtitle' => collect([$principal->code, $principal->contact_person])->filter()->implode(' • '),
                'type' => 'principal',
                'icon' => 'product',
                'url' => $this->productCatalogUrl($user, 'products.principals.edit', 'products.principals.index', $principal, $principal->name),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function brands(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'products', Brand::class, 'brands')) {
            return [];
        }

        return Brand::query()
            ->with('principal:id,name')
            ->where('name', 'ilike', "%{$query}%")
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Brand $brand) => [
                'id' => $brand->id,
                'title' => $brand->name,
                'subtitle' => collect([$brand->principal?->name, $brand->status])->filter()->implode(' • '),
                'type' => 'brand',
                'icon' => 'product',
                'url' => $this->productCatalogUrl($user, 'products.brands.edit', 'products.brands.index', $brand, $brand->name),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function productTypes(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'products', ProductType::class, 'product_types')) {
            return [];
        }

        return ProductType::query()
            ->with('parent:id,name')
            ->where('name', 'ilike', "%{$query}%")
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (ProductType $type) => [
                'id' => $type->id,
                'title' => $type->name,
                'subtitle' => $type->parent?->name ?? __('shell.search.product_type_root'),
                'type' => 'product_type',
                'icon' => 'product',
                'url' => $this->productCatalogUrl($user, 'products.product-types.edit', 'products.product-types.index', $type, $type->name),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function productAttributes(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'products', ProductAttribute::class, 'product_attributes')) {
            return [];
        }

        return ProductAttribute::query()
            ->where('name', 'ilike', "%{$query}%")
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (ProductAttribute $attribute) => [
                'id' => $attribute->id,
                'title' => $attribute->name,
                'subtitle' => $attribute->type,
                'type' => 'product_attribute',
                'icon' => 'product',
                'url' => $this->productCatalogUrl($user, 'products.attributes.edit', 'products.attributes.index', $attribute, $attribute->name),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function productTags(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'products', ProductTag::class, 'product_tags')) {
            return [];
        }

        return ProductTag::query()
            ->where('name', 'ilike', "%{$query}%")
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (ProductTag $tag) => [
                'id' => $tag->id,
                'title' => $tag->name,
                'subtitle' => $tag->color ?: __('shell.search.tag'),
                'type' => 'product_tag',
                'icon' => 'product',
                'url' => $this->productCatalogUrl($user, 'products.tags.edit', 'products.tags.index', $tag, $tag->name),
            ])
            ->all();
    }

    private function productCatalogUrl(User $user, string $editRoute, string $indexRoute, object $model, string $search): string
    {
        if ($user->hasPermissionFor('products', 'update')) {
            return route('module.'.$editRoute, $model);
        }

        return route('module.'.$indexRoute, ['search' => $search]);
    }

    /** @return list<array<string, mixed>> */
    private function vehicles(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'fleet', Vehicle::class, 'vehicles')) {
            return [];
        }

        return Vehicle::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('plate_number', 'ilike', "%{$query}%")
                ->orWhere('brand', 'ilike', "%{$query}%")
                ->orWhere('type', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Vehicle $vehicle) => [
                'id' => $vehicle->id,
                'title' => $vehicle->name,
                'subtitle' => collect([$vehicle->plate_number, $vehicle->status])->filter()->implode(' • '),
                'type' => 'vehicle',
                'icon' => 'vehicle',
                'url' => route('module.fleet.vehicles.show', $vehicle),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function drivers(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'fleet', Driver::class, 'drivers')) {
            return [];
        }

        return Driver::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('license_number', 'ilike', "%{$query}%")
                ->orWhere('phone', 'ilike', "%{$query}%")
                ->orWhere('email', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Driver $driver) => [
                'id' => $driver->id,
                'title' => $driver->name,
                'subtitle' => collect([$driver->license_number, $driver->phone, $driver->status])->filter()->implode(' • '),
                'type' => 'driver',
                'icon' => 'driver',
                'url' => route('module.fleet.drivers.show', $driver),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function orders(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'orders', DeliveryOrder::class, 'delivery_orders')) {
            return [];
        }

        return DeliveryOrder::query()
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhere('delivery_address', 'ilike', "%{$query}%")
                ->orWhere('pickup_address', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (DeliveryOrder $order) => [
                'id' => $order->id,
                'title' => $order->code,
                'subtitle' => collect([$order->status, $order->delivery_address])->filter()->implode(' • '),
                'type' => 'order',
                'icon' => 'order',
                'url' => route('module.orders.show', $order),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function trips(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'transportation', Trip::class, 'trips')) {
            return [];
        }

        return Trip::query()
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhere('origin', 'ilike', "%{$query}%")
                ->orWhere('destination', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Trip $trip) => [
                'id' => $trip->id,
                'title' => $trip->code,
                'subtitle' => collect([
                    $trip->status,
                    collect([$trip->origin, $trip->destination])->filter()->implode(' → '),
                ])->filter()->implode(' • '),
                'type' => 'trip',
                'icon' => 'trip',
                'url' => route('module.transportation.trips.show', $trip),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function tripSchedules(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'transportation', TripSchedule::class, 'trip_schedules')) {
            return [];
        }

        return TripSchedule::query()
            ->where(fn (Builder $q) => $q
                ->where('origin', 'ilike', "%{$query}%")
                ->orWhere('destination', 'ilike', "%{$query}%")
                ->orWhere('cargo_notes', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (TripSchedule $schedule) => [
                'id' => $schedule->id,
                'title' => collect([$schedule->origin, $schedule->destination])->filter()->implode(' → ') ?: '#'.$schedule->id,
                'subtitle' => $schedule->is_active ? __('shell.search.active') : __('shell.search.inactive'),
                'type' => 'trip_schedule',
                'icon' => 'trip',
                'url' => route('module.transportation.schedules.show', $schedule),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function invoices(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'invoicing', Invoice::class, 'invoices')) {
            return [];
        }

        return Invoice::query()
            ->with('partner:id,name')
            ->where('code', 'ilike', "%{$query}%")
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'title' => $invoice->code,
                'subtitle' => collect([$invoice->status, $invoice->partner?->name])->filter()->implode(' • '),
                'type' => 'invoice',
                'icon' => 'invoice',
                'url' => route('module.invoicing.invoices.show', $invoice),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function purchaseOrders(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'purchasing', PurchaseOrder::class, 'purchase_orders')) {
            return [];
        }

        return PurchaseOrder::query()
            ->with('partner:id,name')
            ->where(fn (Builder $q) => $q
                ->where('po_number', 'ilike', "%{$query}%")
                ->orWhereHas('partner', fn (Builder $partner) => $partner->where('name', 'ilike', "%{$query}%")))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id' => $po->id,
                'title' => $po->po_number,
                'subtitle' => collect([$po->status, $po->partner?->name])->filter()->implode(' • '),
                'type' => 'purchase_order',
                'icon' => 'purchase_order',
                'url' => route('module.purchasing.purchase-orders.show', $po),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function grns(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'purchasing', GoodReceiptNote::class, 'good_receipt_notes')) {
            return [];
        }

        return GoodReceiptNote::query()
            ->where(fn (Builder $q) => $q
                ->where('grn_number', 'ilike', "%{$query}%")
                ->orWhere('supplier_do_number', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (GoodReceiptNote $grn) => [
                'id' => $grn->id,
                'title' => $grn->grn_number,
                'subtitle' => collect([$grn->status, $grn->supplier_do_number])->filter()->implode(' • '),
                'type' => 'grn',
                'icon' => 'purchase_order',
                'url' => route('module.purchasing.grn.show', $grn),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function payments(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'receivables', Payment::class, 'payments')) {
            return [];
        }

        return Payment::query()
            ->with('partner:id,name')
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhere('reference_number', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'title' => $payment->code,
                'subtitle' => collect([$payment->status, $payment->partner?->name])->filter()->implode(' • '),
                'type' => 'payment',
                'icon' => 'payment',
                'url' => route('module.receivables.payments.show', $payment),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function warehouses(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'inventory', Warehouse::class, 'warehouses')) {
            return [];
        }

        return Warehouse::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('location', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Warehouse $warehouse) => [
                'id' => $warehouse->id,
                'title' => $warehouse->name,
                'subtitle' => collect([$warehouse->status, $warehouse->location])->filter()->implode(' • '),
                'type' => 'warehouse',
                'icon' => 'warehouse',
                'url' => route('module.inventory.warehouses.show', $warehouse),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function workOrders(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'maintenance', WorkOrder::class, 'work_orders')) {
            return [];
        }

        return WorkOrder::query()
            ->where(fn (Builder $q) => $q
                ->where('title', 'ilike', "%{$query}%")
                ->orWhere('reference_number', 'ilike', "%{$query}%")
                ->orWhereHas('vehicle', fn (Builder $vehicle) => $vehicle
                    ->where('name', 'ilike', "%{$query}%")
                    ->orWhere('plate_number', 'ilike', "%{$query}%")))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (WorkOrder $workOrder) => [
                'id' => $workOrder->id,
                'title' => $workOrder->reference_number ?: $workOrder->title,
                'subtitle' => collect([$workOrder->title, $workOrder->status])->filter()->implode(' • '),
                'type' => 'work_order',
                'icon' => 'work_order',
                'url' => route('module.maintenance.work-orders.show', $workOrder),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function pickLists(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'outbound', PickList::class, 'pick_lists')) {
            return [];
        }

        return PickList::query()
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhereHas('deliveryOrder', fn (Builder $order) => $order->where('code', 'ilike', "%{$query}%")))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (PickList $pickList) => [
                'id' => $pickList->id,
                'title' => $pickList->code,
                'subtitle' => $pickList->status,
                'type' => 'pick_list',
                'icon' => 'pick_list',
                'url' => route('module.outbound.pick-lists.show', $pickList),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function rentals(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'rental', Rental::class, 'rentals')) {
            return [];
        }

        return Rental::query()
            ->with('partner:id,name')
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhereHas('partner', fn (Builder $partner) => $partner->where('name', 'ilike', "%{$query}%")))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Rental $rental) => [
                'id' => $rental->id,
                'title' => $rental->code,
                'subtitle' => collect([$rental->status, $rental->partner?->name])->filter()->implode(' • '),
                'type' => 'rental',
                'icon' => 'rental',
                'url' => route('module.rental.show', $rental),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function salespeople(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'canvassing', Salesperson::class, 'salespeople')) {
            return [];
        }

        return Salesperson::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('employee_code', 'ilike', "%{$query}%")
                ->orWhere('phone', 'ilike', "%{$query}%")
                ->orWhere('email', 'ilike', "%{$query}%")
                ->orWhere('area', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Salesperson $salesperson) => [
                'id' => $salesperson->id,
                'title' => $salesperson->name,
                'subtitle' => collect([$salesperson->employee_code, $salesperson->area])->filter()->implode(' • '),
                'type' => 'salesperson',
                'icon' => 'salesperson',
                'url' => route('module.canvassing.salespeople.show', $salesperson),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function routePlans(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'routing', RoutePlan::class, 'route_plans')) {
            return [];
        }

        return RoutePlan::query()
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhere('depot_address', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (RoutePlan $plan) => [
                'id' => $plan->id,
                'title' => $plan->code,
                'subtitle' => collect([$plan->status, $plan->depot_address])->filter()->implode(' • '),
                'type' => 'route_plan',
                'icon' => 'route_plan',
                'url' => route('module.routing.plans.show', $plan),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function approvalRequests(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'approvals', ApprovalRequest::class, 'approval_requests')) {
            return [];
        }

        return ApprovalRequest::query()
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhere('trigger_type', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (ApprovalRequest $request) => [
                'id' => $request->id,
                'title' => $request->code,
                'subtitle' => collect([$request->status, $request->trigger_type])->filter()->implode(' • '),
                'type' => 'approval',
                'icon' => 'approval',
                'url' => route('module.approvals.requests.show', $request),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function promoPrograms(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'promotions', TradePromoProgram::class, 'trade_promo_programs')) {
            return [];
        }

        return TradePromoProgram::query()
            ->where(fn (Builder $q) => $q
                ->where('code', 'ilike', "%{$query}%")
                ->orWhere('name', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (TradePromoProgram $program) => [
                'id' => $program->id,
                'title' => $program->name,
                'subtitle' => collect([$program->code, $program->status])->filter()->implode(' • '),
                'type' => 'promo_program',
                'icon' => 'promo',
                'url' => route('module.promotions.programs.show', $program),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function tariffs(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'billing', Tariff::class, 'tariffs')) {
            return [];
        }

        return Tariff::query()
            ->where(fn (Builder $q) => $q
                ->where('origin', 'ilike', "%{$query}%")
                ->orWhere('destination', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Tariff $tariff) => [
                'id' => $tariff->id,
                'title' => $tariff->origin.' → '.$tariff->destination,
                'subtitle' => $tariff->is_active ? __('shell.search.active') : __('shell.search.inactive'),
                'type' => 'tariff',
                'icon' => 'billing',
                'url' => route('module.billing.tariffs.index', ['search' => $query]),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function tripAllowances(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'billing', TripAllowance::class, 'trip_allowances')) {
            return [];
        }

        return TripAllowance::query()
            ->with('trip:id,code')
            ->where(fn (Builder $q) => $q
                ->where('notes', 'ilike', "%{$query}%")
                ->orWhereHas('trip', fn (Builder $trip) => $trip->where('code', 'ilike', "%{$query}%")))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (TripAllowance $allowance) => [
                'id' => $allowance->id,
                'title' => $allowance->trip?->code ?? '#'.$allowance->id,
                'subtitle' => $allowance->status,
                'type' => 'allowance',
                'icon' => 'billing',
                'url' => route('module.billing.allowances.show', $allowance),
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function documents(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'document', Document::class, 'documents')) {
            return [];
        }

        return Document::query()
            ->with(['documentType:id,name', 'documentable'])
            ->where(fn (Builder $q) => $q
                ->where('document_number', 'ilike', "%{$query}%")
                ->orWhere('notes', 'ilike', "%{$query}%")
                ->orWhereHas('documentType', fn (Builder $type) => $type->where('name', 'ilike', "%{$query}%")))
            ->limit(self::LIMIT)
            ->get()
            ->map(function (Document $document): ?array {
                $url = $this->documentUrl($document);

                if ($url === null) {
                    return null;
                }

                return [
                    'id' => $document->id,
                    'title' => $document->document_number ?: ($document->documentType?->name ?? '#'.$document->id),
                    'subtitle' => collect([
                        $document->documentType?->name,
                        class_basename((string) $document->documentable_type),
                    ])->filter()->implode(' • '),
                    'type' => 'document',
                    'icon' => 'document',
                    'url' => $url,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function gpsDevices(User $user, string $query): array
    {
        if (! $this->canSearch($user, 'tracking', GpsDevice::class, 'gps_devices')) {
            return [];
        }

        return GpsDevice::query()
            ->where(fn (Builder $q) => $q
                ->where('name', 'ilike', "%{$query}%")
                ->orWhere('unique_id', 'ilike', "%{$query}%"))
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (GpsDevice $device) => [
                'id' => $device->id,
                'title' => $device->name ?: $device->unique_id,
                'subtitle' => collect([$device->unique_id, $device->status])->filter()->implode(' • '),
                'type' => 'gps_device',
                'icon' => 'tracking',
                'url' => route('module.tracking.devices.index', ['search' => $query]),
            ])
            ->all();
    }

    private function documentUrl(Document $document): ?string
    {
        $type = $document->documentable_type;

        if (in_array($type, ['vehicle', Vehicle::class], true) && $document->documentable_id) {
            return route('module.fleet.vehicles.documents.show', [$document->documentable_id, $document]);
        }

        if (in_array($type, ['driver', Driver::class], true) && $document->documentable_id) {
            return route('module.fleet.drivers.documents.show', [$document->documentable_id, $document]);
        }

        return null;
    }

    /**
     * @param  class-string  $modelClass
     */
    private function canSearch(User $user, string $moduleKey, string $modelClass, string $table): bool
    {
        return Modules::available($moduleKey)
            && $user->hasPermissionFor($moduleKey, 'view')
            && class_exists($modelClass)
            && Schema::hasTable($table);
    }
}
