<?php

namespace Modules\Document\Console\Commands;

use App\Models\Tenant;
use App\Modules\Facades\Modules;
use App\Notifications\GenericNotification;
use App\Support\NotificationRecipients;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentReminder;
use Throwable;

/**
 * Turns document expiry dates into staff alerts.
 *
 * Runs per tenant on a daily schedule (the same shape as tracking:poll and
 * modules:purge-expired). For each document, every reminder threshold its type
 * defines that has been crossed gets a DocumentReminder row and one in-app
 * notification — once. Idempotency comes from the unique (document_id,
 * days_before) key, so re-running the same day, or catching up several missed
 * thresholds at once, never double-notifies.
 */
class DocumentScanExpiring extends Command
{
    protected $signature = 'document:scan-expiring
                            {--tenant= : Limit to a single tenant id}';

    protected $description = 'Create reminders and notify staff about documents nearing or past expiry';

    public function handle(): int
    {
        $tenants = Tenant::query()
            ->when($this->option('tenant'), fn ($query, $id) => $query->whereKey($id))
            ->get();

        $created = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $created += $tenant->run(function (): int {
                    if (! Modules::available('document')) {
                        return 0;
                    }

                    return $this->scan();
                });
            } catch (Throwable $e) {
                $this->error("  {$tenant->id}: scan failed — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Raised {$created} document reminder(s) across {$tenants->count()} tenant(s).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function scan(): int
    {
        $recipients = NotificationRecipients::forPermission('document', 'view');
        $raised = 0;

        $documents = Document::query()
            ->whereNotNull('expires_at')
            ->with(['documentType', 'documentable', 'reminders'])
            ->get();

        foreach ($documents as $document) {
            // The type's own thresholds, plus 0 for a final alert the day it
            // actually lapses.
            $thresholds = collect($document->documentType?->reminder_days ?? [])
                ->push(0)
                ->map(fn ($d) => (int) $d)
                ->unique();

            foreach ($thresholds as $daysBefore) {
                if (now()->lt($document->expires_at->copy()->subDays($daysBefore))) {
                    continue; // threshold not reached yet
                }

                if ($document->reminders->contains('days_before', $daysBefore)) {
                    continue; // already raised
                }

                $reminder = $document->reminders()->create([
                    'days_before' => $daysBefore,
                    'remind_at' => now(),
                    'sent_at' => now(),
                ]);
                $document->reminders->push($reminder);

                if ($recipients->isNotEmpty()) {
                    Notification::send($recipients, new GenericNotification(
                        title: $this->title($document, $daysBefore),
                        body: $this->body($document),
                        url: route('module.documents.index'),
                        icon: 'document',
                        type: $daysBefore === 0 ? 'danger' : 'warning',
                    ));
                }

                $raised++;
            }
        }

        return $raised;
    }

    private function title(Document $document, int $daysBefore): string
    {
        $type = $document->documentType?->name ?? 'Dokumen';

        return $daysBefore === 0
            ? "{$type} telah kedaluwarsa"
            : "{$type} kedaluwarsa dalam {$daysBefore} hari";
    }

    private function body(Document $document): string
    {
        $owner = $this->ownerLabel($document);
        $number = $document->document_number ? " ({$document->document_number})" : '';

        return trim("{$owner}{$number} — berlaku sampai {$document->expires_at->format('d/m/Y')}");
    }

    private function ownerLabel(Document $document): string
    {
        $owner = $document->documentable;

        if ($owner === null) {
            return 'Dokumen';
        }

        // Vehicle carries name + plate; Driver just a name. Read defensively so
        // this never depends on a specific Fleet shape.
        $name = $owner->name ?? '';
        $plate = $owner->plate_number ?? null;

        return $plate ? "{$name} ({$plate})" : ($name ?: 'Dokumen');
    }
}
