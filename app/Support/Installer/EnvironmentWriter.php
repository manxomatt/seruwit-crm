<?php

namespace App\Support\Installer;

use Illuminate\Support\Facades\File;

/**
 * Writes keys into the .env file for the installer, updating a key in place or
 * appending it when absent. Values are quoted when they need it, and secrets are
 * never echoed back — the writer only ever receives values, it does not return
 * them.
 *
 * The running process keeps its boot-time config, so a value written here only
 * takes effect on the next request. That is fine for the multi-step web wizard
 * (each step is a fresh boot) precisely because the installer runs with config
 * uncached; InstallationFinalizer caches config only at the very end.
 */
class EnvironmentWriter
{
    public function __construct(private ?string $path = null) {}

    public function path(): string
    {
        return $this->path ?? base_path('.env');
    }

    /**
     * @param  array<string, string|bool|int|null>  $values
     */
    public function write(array $values): void
    {
        $path = $this->path();
        $contents = File::exists($path) ? File::get($path) : '';

        foreach ($values as $key => $value) {
            $line = $key.'='.$this->format($value);
            $pattern = '/^'.preg_quote($key, '/').'=.*$/m';

            if (preg_match($pattern, $contents) === 1) {
                $contents = (string) preg_replace($pattern, $line, $contents, 1);
            } else {
                $contents = ($contents === '' ? '' : rtrim($contents, "\n")."\n").$line."\n";
            }
        }

        File::put($path, $contents);
    }

    private function format(string|bool|int|null $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        $value = (string) $value;

        if ($value === '' || preg_match('/[\s#"\'$]/', $value) === 1) {
            return '"'.addcslashes($value, '"\\').'"';
        }

        return $value;
    }
}
