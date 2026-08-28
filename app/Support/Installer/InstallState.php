<?php

namespace App\Support\Installer;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * Single source of truth for whether the platform has been installed.
 *
 * The check is a bare file_exists on a lock file — deliberately DB-free, since
 * the installer runs before the central schema (and even the sessions table)
 * exists. A row in platform_settings is written alongside as an audit trail,
 * never as the gate: the lock file is authoritative.
 *
 * config('app.installed') is an explicit override that wins over the lock file
 * when set — used to skip the installer on manually provisioned deployments and
 * to keep the test suite past the gate.
 */
final class InstallState
{
    public const INSTALLED_AT_KEY = 'general.installed_at';

    /**
     * Absolute path to the install lock file.
     */
    public static function lockPath(): string
    {
        return base_path('storage/framework/installed');
    }

    public static function isInstalled(): bool
    {
        $override = config('app.installed');

        if ($override !== null) {
            return (bool) $override;
        }

        return File::exists(self::lockPath());
    }

    /**
     * Seal the installer for good: write the lock file, then best-effort stamp
     * the audit row. The database is guaranteed migrated by the time finalize
     * calls this, but the audit write is still guarded so a failure there can
     * never leave the platform un-lockable.
     */
    public static function markInstalled(): void
    {
        File::ensureDirectoryExists(dirname(self::lockPath()));
        File::put(self::lockPath(), now()->toIso8601String().PHP_EOL);

        try {
            PlatformSetting::setValue(self::INSTALLED_AT_KEY, now()->toIso8601String());
        } catch (Throwable) {
            // The lock file is the source of truth; the audit row is a convenience.
        }
    }

    /**
     * Remove the lock file, reopening the installer. For test setup/teardown and
     * deliberate re-install tooling — never called by normal request flow.
     */
    public static function forget(): void
    {
        if (File::exists(self::lockPath())) {
            File::delete(self::lockPath());
        }
    }
}
