# Modules Specification

## Purpose
Governs the pluggable module architecture where optional capabilities in `modules/<Name>/` can be independently installed, upgraded, or uninstalled per tenant, constrained by subscription plan entitlements, platform-level registry controls, and strict architectural layer dependencies.

## Requirements

### Requirement: Module Contract and Discovery
The system SHALL discover and register all modular capabilities declared in `config/modules.php` implementing `App\Modules\ModuleContract`, providing standardized metadata, permission lists, navigation menus, and boot hooks.

#### Scenario: Module boot execution
- **GIVEN** registered modules defined in configuration
- **WHEN** the application boots
- **THEN** each module's `boot()` method registers model relationships, listeners, and observers without executing runtime tenant database queries.

---

### Requirement: Architectural Layering and Dependencies
The system SHALL enforce a 3-tier hierarchy (`Content` <= `Foundation` <= `Vertical`) ensuring modules only declare dependencies (`requires()`) on modules within the same or lower architectural tiers.

#### Scenario: Valid downward dependency
- **GIVEN** a Vertical tier module such as `TransportationManagement`
- **WHEN** its declared dependencies include Foundation tier modules (`Fleet`, `Partners`, `Product`)
- **THEN** the system validates the dependency graph successfully.

#### Scenario: Upward or inverted dependency violation
- **GIVEN** a Foundation tier module such as `Fleet`
- **WHEN** it attempts to declare a dependency on a Vertical tier module such as `TransportationManagement`
- **THEN** the system rejects the module layering configuration during automated tests and module validation.

---

### Requirement: Three-Axis Module Availability Triad
The system SHALL evaluate module accessibility based on three distinct criteria: Platform Enabled (`ModuleRegistry::platformEnabled`), Plan Entitled (`PlanRepository::entitled`), and Tenant Installed (`installed_modules`).

#### Scenario: Complete availability satisfied
- **GIVEN** a module is enabled platform-wide, included in the tenant's active plan, and installed in the tenant workspace
- **WHEN** availability is evaluated via `available()`
- **THEN** the module is accessible and usable within the tenant.

#### Scenario: Platform registry kill switch override
- **GIVEN** a module is entitled and installed in a tenant workspace
- **WHEN** a central administrator disables the module in the platform registry
- **THEN** the module immediately becomes unreachable for all tenants across the platform without altering tenant data.

#### Scenario: Plan downgrade without data loss
- **GIVEN** an installed module is no longer entitled following a tenant subscription downgrade
- **WHEN** the module status is checked
- **THEN** the module enters a locked state (`locked_with_data`), remaining non-functional in the UI while retaining its database tables intact.

---

### Requirement: Recursive Auto-Installation
The system SHALL automatically install missing dependency modules when a tenant administrator installs a target module, provided all dependencies are entitled by the tenant's subscription plan.

#### Scenario: Cascading dependency installation
- **GIVEN** a tenant on the `Pro` plan requests installation of `Orders`
- **WHEN** `Orders` requires `TransportationManagement`, which in turn requires `Fleet`, `Partners`, and `Product`
- **THEN** the installer installs `Product`, `Partners`, `Fleet`, `TransportationManagement`, and `Orders` in correct dependency order.

---

### Requirement: Non-Destructive Uninstall and Grace Period Purge
The system SHALL preserve database tables and stored records upon module uninstallation, scheduling data purge only after a configurable grace period has expired (default 30 days).

#### Scenario: Re-installation within grace period
- **GIVEN** a tenant uninstalls a module and its data is marked inactive
- **WHEN** the tenant re-installs the module within 30 days
- **THEN** the module is restored with historical records completely intact.

#### Scenario: Automated purge of expired data
- **GIVEN** a module was uninstalled more than 30 days ago
- **WHEN** the scheduled `modules:purge-expired` command runs
- **THEN** the system drops the module's tenant-specific tables and removes historical records permanently.

---

### Requirement: Strict Middleware Gating
The system SHALL gate all module routes with `requires-module` middleware, returning HTTP 404 if the module is not installed or not available, without any super admin bypass.

#### Scenario: Tenant admin attempts direct URL to uninstalled module
- **GIVEN** a tenant user with admin role navigates to an uninstalled module route
- **WHEN** the request passes through `requires-module` middleware
- **THEN** the system returns an HTTP 404 response regardless of user privileges.
