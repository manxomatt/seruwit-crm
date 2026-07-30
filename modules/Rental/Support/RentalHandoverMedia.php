<?php

namespace Modules\Rental\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Persist checkout/return photos and signatures from data-URL payloads.
 */
class RentalHandoverMedia
{
    /**
     * @param  list<string>  $dataUrls
     * @return list<string>
     */
    public function storePhotos(array $dataUrls, string $directory = 'rental/handover-photos'): array
    {
        $paths = [];

        foreach ($dataUrls as $dataUrl) {
            if (! is_string($dataUrl) || ! str_starts_with($dataUrl, 'data:image/')) {
                continue;
            }

            $paths[] = $this->storeImage($dataUrl, $directory, 'jpg');
        }

        return $paths;
    }

    public function storeSignature(?string $dataUrl, string $directory = 'rental/signatures'): ?string
    {
        if ($dataUrl === null || $dataUrl === '' || ! str_starts_with($dataUrl, 'data:image/')) {
            return null;
        }

        return $this->storeImage($dataUrl, $directory, 'png');
    }

    public function storeImage(string $dataUrl, string $directory, string $extension): string
    {
        $payload = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $binary = base64_decode($payload, true);

        if ($binary === false) {
            throw new \InvalidArgumentException('Invalid image data URL.');
        }

        $path = $directory.'/'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    /**
     * @param  list<string>|null  $paths
     * @return list<string>
     */
    public function publicUrls(?array $paths): array
    {
        if ($paths === null || $paths === []) {
            return [];
        }

        return array_values(array_filter(array_map(
            fn (string $path): ?string => $this->publicUrl($path),
            $paths,
        )));
    }

    public function publicUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        try {
            return route('stancl.tenancy.asset', ['path' => $path], false);
        } catch (\Throwable) {
            return '/storage/'.$path;
        }
    }
}
