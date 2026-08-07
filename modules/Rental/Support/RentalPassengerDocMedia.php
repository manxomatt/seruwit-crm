<?php

namespace Modules\Rental\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Store passenger KTP/SIM uploads for public rental bookings.
 */
class RentalPassengerDocMedia
{
    public function __construct(private readonly RentalHandoverMedia $handover) {}

    public function storeUpload(UploadedFile $file, int $rentalId, string $kind): string
    {
        $directory = 'rental/passenger-docs/'.$rentalId;
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'pdf'], true)) {
            $extension = 'jpg';
        }

        $path = $directory.'/'.$kind.'-'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()) ?: '');

        return $path;
    }

    public function publicUrl(?string $path): ?string
    {
        return $this->handover->publicUrl($path);
    }
}
