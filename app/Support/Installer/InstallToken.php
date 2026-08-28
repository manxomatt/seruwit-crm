<?php

namespace App\Support\Installer;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Anti-hijack secret for the first-run web installer.
 *
 * On a public first boot the installer is world-reachable until it completes, so
 * the operator mints a token (php artisan app:install-token) and the web wizard's
 * first step requires it. The CLI installer runs from a trusted shell and does not
 * need it. An APP_INSTALL_TOKEN env value takes precedence over the token file.
 */
final class InstallToken
{
    public static function path(): string
    {
        return base_path('storage/framework/install-token');
    }

    public static function current(): ?string
    {
        $fromEnv = config('app.install_token');

        if (filled($fromEnv)) {
            return (string) $fromEnv;
        }

        return File::exists(self::path()) ? trim(File::get(self::path())) : null;
    }

    /**
     * Whether the token is pinned via env rather than the rotatable file.
     */
    public static function isFromEnv(): bool
    {
        return filled(config('app.install_token'));
    }

    public static function generate(): string
    {
        $token = Str::random(48);

        File::ensureDirectoryExists(dirname(self::path()));
        File::put(self::path(), $token.PHP_EOL);

        return $token;
    }

    /**
     * The current token, minting a file-backed one if none exists yet.
     */
    public static function ensure(): string
    {
        return self::current() ?? self::generate();
    }

    public static function matches(?string $candidate): bool
    {
        $current = self::current();

        return $current !== null && $candidate !== null && hash_equals($current, $candidate);
    }

    public static function forget(): void
    {
        if (File::exists(self::path())) {
            File::delete(self::path());
        }
    }
}
