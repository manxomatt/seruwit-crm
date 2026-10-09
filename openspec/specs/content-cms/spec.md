# Content CMS Specification

## Purpose
Provides tenant organizations with public-facing website publishing tools, including visual page creation with GrapesJS, blog post management, image carousels, dynamic navigation menus, and tenant-isolated media storage.

## Requirements

### Requirement: Media Library Isolation
The system SHALL manage media assets within tenant-specific storage directories (`storage/tenant_<id>/...`) and deliver them through tenancy asset routes, preventing cross-tenant access.

#### Scenario: File upload and URL resolution
- **GIVEN** an authenticated tenant user uploading an image
- **WHEN** the upload finishes
- **THEN** the file is saved into the tenant's private disk path, a media record is created, and the resolved URL points to the tenant-scoped asset endpoint.

---

### Requirement: Visual Page Builder (GrapesJS)
The system SHALL enable users to construct custom landing and informational pages using the GrapesJS visual editor, supporting HTML/CSS storage, custom URL slugs (`/p/{slug}`), and designated root homepages (`/`).

#### Scenario: Publishing a custom page
- **GIVEN** a page draft with custom HTML, CSS, and slug `about-us`
- **WHEN** the user marks the page as published
- **THEN** public visitors can access the page at `/p/about-us` without authentication.

#### Scenario: Setting workspace homepage
- **GIVEN** a published page selected as the tenant homepage
- **WHEN** a public visitor navigates to the tenant root domain `https://acme.seruwit.com/`
- **THEN** the system renders the designated page layout.

---

### Requirement: Blog Posts Engine
The system SHALL manage blog articles with draft/publish workflows, categories, rich text formatting via TipTap, and public index and detail endpoints at `/blog`.

#### Scenario: Public blog viewing
- **GIVEN** a published post with slug `launch-announcement`
- **WHEN** an external visitor visits `/blog/launch-announcement`
- **THEN** the post title, content, author, and publication timestamp are presented publicly.

#### Scenario: Draft post protection
- **GIVEN** a post in `draft` status
- **WHEN** an unauthenticated visitor attempts to navigate to its URL
- **THEN** the system returns an HTTP 404 response.

---

### Requirement: Dynamic Navigation Menus and Carousels
The system SHALL allow tenant administrators to configure navigational menus (header/footer hierarchies) and banner carousels for promotional slides.

#### Scenario: Menu item ordering and structure
- **GIVEN** an active header navigation menu with custom page links and external URLs
- **WHEN** public pages are rendered
- **THEN** navigation links are output in the configured order.
