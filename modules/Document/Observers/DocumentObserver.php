<?php

namespace Modules\Document\Observers;

use App\Modules\Facades\Modules;
use Modules\Document\Models\Document;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

/**
 * Keeps the "quick-access" expiry columns on Vehicle and Driver in sync
 * whenever a document is saved. Lives in Document so Fleet stays free of
 * any knowledge of this module — consistent with how BillingModule and
 * OrdersModule attach observers to upstream models.
 *
 * Sync map:
 *   vehicle  stnk             → vehicles.stnk_expires_at
 *   vehicle  kir              → vehicles.kir_expires_at
 *   driver   sim_a|sim_b1|sim_b2 → drivers.license_expires_at (latest wins)
 */
class DocumentObserver
{
    public function saved(Document $document): void
    {
        if (! Modules::available('document')) {
            return;
        }

        $document->loadMissing(['documentType', 'documentable']);

        $type = $document->documentType;
        $entity = $document->documentable;

        if ($type === null || $entity === null) {
            return;
        }

        if ($entity instanceof Vehicle) {
            $this->syncVehicle($entity, $type->key, $document);
        } elseif ($entity instanceof Driver) {
            $this->syncDriver($entity, $type->key, $document);
        }
    }

    private function syncVehicle(Vehicle $vehicle, string $key, Document $document): void
    {
        match ($key) {
            'stnk' => $vehicle->updateQuietly(['stnk_expires_at' => $document->expires_at]),
            'kir' => $vehicle->updateQuietly(['kir_expires_at' => $document->expires_at]),
            default => null,
        };
    }

    private function syncDriver(Driver $driver, string $key, Document $document): void
    {
        if (in_array($key, ['sim_a', 'sim_b1', 'sim_b2'], true)) {
            $driver->updateQuietly(['license_expires_at' => $document->expires_at]);
        }
    }
}
