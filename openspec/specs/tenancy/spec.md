# Tenancy Specification

## Purpose
Provides multi-tenant workspace isolation using `stancl/tenancy` where each tenant organization operates on a dedicated PostgreSQL schema (`tenant_<id>`) and dedicated Redis cache namespace, while a central control plane manages provisioning, subscription plans, domain routing, and cross-workspace single sign-on.

## Requirements

### Requirement: Database Schema Isolation
The system SHALL isolate tenant data within individual PostgreSQL schemas so that database queries executed in tenant context cannot access another tenant's schema or the central schema directly.

#### Scenario: Tenant schema activation on domain resolution
- **GIVEN** a tenant workspace exists with id `acme` and schema `tenant_acme`
- **WHEN** an incoming HTTP request arrives targeting `acme.seruwit.com` or an associated custom domain
- **THEN** the system resolves the tenant, sets PostgreSQL `search_path` to `tenant_acme`, and scopes cache keys to the tenant namespace.

#### Scenario: Central context isolation
- **GIVEN** a request is made to the central domain `seruwit.com`
- **WHEN** central controllers and actions execute
- **THEN** the system operates on the `public` schema and does not expose tenant schema models.

---

### Requirement: Automated Tenant Provisioning
The system SHALL automate workspace provisioning upon company registration or admin action, ensuring all necessary schema migrations, default seeders, and plan-entitled modules are prepared before user access.

#### Scenario: Successful workspace creation
- **GIVEN** valid company details, subdomain, admin credentials, and a selected subscription plan
- **WHEN** the tenant provisioning action is triggered
- **THEN** the system creates a central tenant record, establishes the PostgreSQL schema, runs tenant migrations, seeds base roles and settings, and auto-installs entitled modules.

#### Scenario: Duplicate subdomain rejection
- **GIVEN** a tenant already exists with subdomain `acme`
- **WHEN** a new registration attempts to claim `acme.seruwit.com`
- **THEN** the system rejects the registration with a validation error indicating the subdomain is unavailable.

---

### Requirement: Central-to-Tenant Identity Synchronization
The system SHALL maintain a global user record in the central schema for authentication and single sign-on while synchronizing profile credentials (name, email, password) to corresponding tenant user records.

#### Scenario: User password update propagation
- **GIVEN** a user belongs to multiple tenant workspaces
- **WHEN** the user updates their password in the central profile or in a tenant workspace
- **THEN** the system updates the global user record and synchronizes the hashed password to all linked tenant user records.

#### Scenario: Independent tenant roles
- **GIVEN** a global user is a member of tenant `alpha` and tenant `beta`
- **WHEN** role assignments are updated in tenant `alpha`
- **THEN** the user's role in tenant `beta` remains completely unchanged.

---

### Requirement: Custom Domain Routing
The system SHALL support custom domains mapped to specific tenant workspaces with verification and security guards.

#### Scenario: Custom domain request dispatch
- **GIVEN** a verified custom domain `crm.clientcompany.com` mapped to tenant `acme`
- **WHEN** a web request arrives at `crm.clientcompany.com`
- **THEN** the system resolves tenant `acme` and activates the corresponding tenant context identically to subdomain access.
