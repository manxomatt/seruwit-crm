# Access Control Specification

## Purpose
Defines user authentication, identity federation across tenant boundaries, tenant-level Role-Based Access Control (RBAC), permission evaluation, and secure workspace invitations.

## Requirements

### Requirement: Unified Authentication and SSO
The system SHALL authenticate users using email or username via Laravel Breeze and Sanctum, issuing session cookies or API tokens, and enabling single sign-on across authorized tenant workspaces.

#### Scenario: Multi-workspace session navigation
- **GIVEN** an authenticated user on the central domain portal
- **WHEN** the user selects one of their permitted tenant workspaces
- **THEN** the system generates a secure redirection token and transitions the user into the tenant workspace without re-prompting for credentials.

---

### Requirement: Tenant-Level Role-Based Access Control (RBAC)
The system SHALL evaluate user actions against granular permissions assigned through tenant roles, using the `module:action` permission naming convention (e.g., `invoicing:create`, `fleet:delete`).

#### Scenario: Authorized action execution
- **GIVEN** a tenant user with a role possessing `sales:create`
- **WHEN** the user submits a new sales order creation request
- **THEN** the authorization check succeeds and the action is processed.

#### Scenario: Unauthorized action denial
- **GIVEN** a tenant user whose role only contains `sales:view`
- **WHEN** the user attempts to delete a sales order
- **THEN** the authorization check denies the request with an HTTP 403 Forbidden response.

---

### Requirement: Administrator Permission Bypass
The system SHALL grant administrator roles immediate bypass over granular permission checks within the workspace, while still respecting module installation and plan availability restrictions.

#### Scenario: Admin bypasses missing individual permission
- **GIVEN** a tenant user with the `Admin` role in an active module
- **WHEN** performing an action where no explicit permission row exists for that user
- **THEN** the authorization check succeeds due to admin bypass.

#### Scenario: Admin denied on uninstalled module
- **GIVEN** a tenant user with the `Admin` role
- **WHEN** attempting to access a route belonging to an uninstalled or unentitled module
- **THEN** the request fails with HTTP 404 because `requires-module` middleware takes precedence over RBAC.

---

### Requirement: Workspace Member Invitations
The system SHALL support inviting new and existing users to join a tenant workspace with assigned roles via signed invitation tokens expiring in 7 days.

#### Scenario: Successful invitation acceptance
- **GIVEN** a valid, unexpired workspace invitation token
- **WHEN** an invitee accepts the invitation and verifies their credentials
- **THEN** the system attaches the user to the tenant workspace, assigns the designated role, and expires the invitation token.

#### Scenario: Expired invitation rejection
- **GIVEN** an invitation created more than 7 days ago
- **WHEN** the invitee attempts to accept the invitation
- **THEN** the system rejects the request with an error indicating token expiration.
