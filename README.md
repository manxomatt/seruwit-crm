# Seruwit CMS

A modern, full-featured Content Management System built with Laravel 12, Inertia.js, React, and Tailwind CSS.

## Features

- **Page Builder** - Visual page editor with GrapesJS integration
- **Blog/Posts** - Create and manage blog posts with rich content
- **Media Library** - Upload and manage images, documents, and other media files
- **Carousels** - Create dynamic image carousels/sliders
- **Live Updates** - Real-time content updates and announcements
- **User Management** - Full user management with profiles
- **Role-Based Access Control (RBAC)** - Flexible roles and permissions system
- **Settings Management** - Configurable site settings
- **Dynamic Menus** - Customizable navigation menus

## Tech Stack

- **Backend**: PHP 8.5, Laravel 12
- **Frontend**: React 18, Inertia.js v2, Tailwind CSS 3
- **Database**: SQLite (default), MySQL/PostgreSQL supported
- **Authentication**: Laravel Breeze with Sanctum

## Requirements

- PHP >= 8.2
- Composer
- Node.js >= 18
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/seruwit-cms.git
   cd seruwit-cms
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

5. **Database setup**
   ```bash
   touch database/database.sqlite
   php artisan migrate --seed
   ```

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

After seeding, the following users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password | Admin |
| editor@example.com | password | Editor |
| user@example.com | password | User |

## Project Structure

```
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/          # Admin panel controllers
│   │   └── Module/         # Module controllers (shared functionality)
│   └── Models/             # Eloquent models
├── database/
│   ├── factories/          # Model factories for testing
│   ├── migrations/         # Database migrations
│   └── seeders/            # Database seeders
├── resources/
│   └── js/
│       ├── Components/     # Reusable React components
│       ├── Layouts/        # Page layouts
│       └── Pages/          # Inertia pages
├── routes/
│   ├── web.php            # Web routes
│   └── auth.php           # Authentication routes
└── tests/
    └── Feature/           # Feature tests
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

## Available Modules

| Module | Description |
|--------|-------------|
| Pages | Visual page builder with GrapesJS |
| Posts | Blog post management |
| Media | Media library for file uploads |
| Carousels | Image carousel/slider management |
| Live Updates | Real-time announcements |
| Users | User management |
| Roles | Role and permission management |
| Settings | Site configuration |
| Analytics | Dashboard analytics |

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
