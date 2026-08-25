<?php

use App\Http\Controllers\Install\AdminAccountController;
use App\Http\Controllers\Install\DatabaseController;
use App\Http\Controllers\Install\FinalizeController;
use App\Http\Controllers\Install\MigrationController;
use App\Http\Controllers\Install\PlatformController;
use App\Http\Controllers\Install\RequirementController;
use App\Http\Controllers\Install\UnlockController;
use App\Http\Controllers\Install\WelcomeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Installer Routes
|--------------------------------------------------------------------------
|
| The first-run installer. Registered from bootstrap/app.php with the lean
| "install" middleware group (NOT the web group) so it stays reachable before
| the database is migrated — the default database-backed session and cache, and
| the Inertia prop sharing appended to the web group, would all fail on a fresh
| deployment. Deliberately not bound to the central domain either: on first boot
| APP_URL / the tenant base domain may not be configured yet, and the gate seals
| these routes off the moment installation completes.
|
| GET /install currently renders a placeholder; the Inertia wizard shell replaces
| it in a later phase. The step endpoints below carry the actual work and are
| driven by that wizard (and, later, the CLI).
|
*/

Route::get('/install', [WelcomeController::class, 'index'])->name('install.index');

// Verifies the installer token and unlocks the session (no-op when no token is set).
Route::post('/install/unlock', [UnlockController::class, 'store'])->name('install.unlock');

Route::get('/install/requirements', [RequirementController::class, 'index'])->name('install.requirements');

Route::post('/install/database/test', [DatabaseController::class, 'test'])->name('install.database.test');
Route::post('/install/database', [DatabaseController::class, 'store'])->name('install.database.store');

Route::post('/install/migrate', [MigrationController::class, 'run'])->name('install.migrate');

Route::post('/install/platform', [PlatformController::class, 'store'])->name('install.platform.store');

Route::post('/install/admin', [AdminAccountController::class, 'store'])->name('install.admin.store');

Route::post('/install/finalize', [FinalizeController::class, 'store'])->name('install.finalize');
