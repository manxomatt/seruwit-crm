# Seruwit CRM

A multi-tenant SaaS CMS/CRM built with Laravel 12, Inertia.js, React, and Tailwind CSS. Each tenant gets its own isolated PostgreSQL schema (via `stancl/tenancy`) and a pluggable module system so features can be installed per-tenant according to the subscription plan they're on.

## Features

### Core (ships with every tenant)
- **Page Builder** - Visual page editor with GrapesJS integration
- **Blog/Posts** - Create and manage blog posts with rich content
- **Media Library** - Upload and manage images, documents, and other media files
- **Live Updates** - Real-time content updates and announcements
- **User Management** - Full user management with profiles and invitations
- **Role-Based Access Control (RBAC)** - Flexible roles and per-module permissions
- **Settings** - Grouped, form-based settings management. A tenant can edit the *values* of its own settings (e.g. its own social media links); defining, renaming, or deleting a setting is a central-admin-only capability that automatically propagates new settings to every tenant.
- **Dynamic Menus** - Customizable navigation menus
- **Analytics** - Dashboard analytics

### Optional (installable per tenant, gated by subscription plan)
- **Carousels** - Dynamic image carousels/sliders
- **Fleet** - Vehicles and drivers, reusable by any module that needs them
- **Transportation Management** - Trip dispatch, live checkpoint tracking, recurring trip schedules, a calendar view, and cost/utilization reports — built on top of Fleet, Customer, and Product
- **Customer** - Shared customer records (with a `global_customer_id` reserved for a future cross-tenant customer app)
- **Product** - Product catalog, with unit-of-measure options centrally managed via Settings

### Platform administration (central domain only)
- **Tenant management** - Provision, suspend, and manage tenant workspaces
- **Plans** - Define which modules each subscription plan includes
- **Module Registry** - A platform-wide kill switch to disable a module for every tenant at once, independent of plan or install state

## Tech Stack

- **Backend**: PHP 8.4, Laravel 12, `stancl/tenancy` (multi-tenancy)
- **Frontend**: React 18, Inertia.js v2, Tailwind CSS 3, Headless UI v2
- **Database**: PostgreSQL (schema-per-tenant), Redis (tenant-aware cache)
- **Authentication**: Laravel Breeze with Sanctum

## Requirements

- PHP >= 8.2
- PostgreSQL (schema-per-tenant multi-tenancy requires it; SQLite/MySQL are not supported)
- Redis (tenant-aware cache)
- Composer
- Node.js >= 18
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/seruwit-crm.git
   cd seruwit-crm
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Set `DB_CONNECTION=pgsql` and your PostgreSQL/Redis credentials in `.env`.

5. **Database setup**
   ```bash
   php artisan migrate --seed
   ```
   This migrates and seeds the central database (plans, module registry, platform settings). Each tenant gets its own schema, migrated and seeded automatically when it's provisioned — see `App\Actions\Tenancy\CreateTenantAction`.

6. **Create storage link**
   ```bash
   php artisan storage:link
   ```

7. **Build assets**
   ```bash
   npm run build
   ```

8. **Start the development server**
   ```bash
   composer run dev
   ```
   Or run separately:
   ```bash
   php artisan serve
   npm run dev
   ```

## Default Users

After seeding the central database (`php artisan migrate --seed`), the following users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@domain.com | password | Admin |
| test@domain.com | password | User |

A tenant workspace's own users are created separately when that tenant is provisioned (see [Multi-Tenancy](#multi-tenancy) below).

## Multi-Tenancy

The app runs on two kinds of domains:

- **Central domain** (`config('app.url')`) — the platform: authentication, the workspace portal, and (when `CENTRAL_SERVES_APP=true`, the default for local dev) the full CRM too. Platform administration (Tenant management, Plans, Module Registry) only exists here.
- **Tenant domains** (`{subdomain}.{app-host}`) — each tenant's own isolated PostgreSQL schema, provisioned via `App\Actions\Tenancy\CreateTenantAction`, which creates the schema, runs migrations, and seeds it independently of the central database.

`routes/app.php` holds the CRM's routes and is `require`'d from both `routes/web.php` (central) and `routes/tenant.php` (tenant domains), so most controllers serve both contexts. Central-only features are registered exclusively in `routes/web.php`, gated by a `can:manage-*` ability (see `AppServiceProvider`).

## Module System

Beyond the core features every tenant has, functionality is organized into pluggable modules (`app/Modules/ModuleContract`) that a tenant can install if their subscription plan includes it:

- **Plans** (central) define which modules a tenant is *entitled* to.
- **Module Registry** (central) can disable a module platform-wide regardless of plan.
- A tenant installs/uninstalls modules it's entitled to from its own workspace; `ModuleInstaller` auto-installs any modules a requested one `requires()` (e.g. installing Transportation Management also installs Fleet, Customer, and Product).
- Uninstalling is non-destructive — a module's tables and data survive so reinstalling restores everything (see `modules:purge-expired` for the grace-period cleanup).

Module source lives under `modules/{ModuleName}/`, each with its own manifest, migrations, models, controllers, requests, and React pages — mirroring the structure of `app/` and `resources/js/` for that module's slice of the app.

## Project Structure

```
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/          # Shared controller base classes
│   │   ├── Central/        # Central-domain-only controllers (workspaces, invitations)
│   │   └── Module/         # Module controllers (served on both central and tenant domains)
│   ├── Models/             # Eloquent models
│   ├── Modules/            # Module system: ModuleContract, ModuleRegistry, ModuleInstaller
│   └── Actions/Tenancy/    # Tenant provisioning
├── modules/                 # Optional/installable modules (Fleet, TransportationManagement, Customer, Product, Carousels)
│   └── {ModuleName}/
│       ├── Database/Migrations/
│       ├── Http/{Controllers,Requests}/
│       ├── Models/
│       └── resources/js/Pages/
├── database/
│   ├── factories/          # Model factories for testing
│   ├── migrations/         # Central database migrations
│   ├── migrations/tenant/  # Tenant schema migrations
│   └── seeders/            # Database seeders
├── resources/
│   └── js/
│       ├── Components/     # Reusable React components
│       ├── Layouts/        # Page layouts
│       └── Pages/          # Inertia pages (core features)
├── routes/
│   ├── web.php             # Central-domain routes
│   ├── tenant.php          # Tenant-domain routes
│   ├── app.php             # Shared CRM routes, required from both of the above
│   └── auth.php            # Authentication routes
└── tests/
    ├── Feature/            # Feature tests
    └── Feature/Modules/    # Per-module feature tests
```

## Testing

Run the test suite:
```bash
php artisan test
```

Run with coverage:
```bash
php artisan test --coverage
```

## Code Style

This project uses Laravel Pint for code formatting:
```bash
vendor/bin/pint
```

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
