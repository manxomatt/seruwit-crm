<?php

namespace Modules\Document\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Document\Models\Document;

class DocumentController extends Controller
{
    /**
     * Control-center: all documents across all entities, filtered by status.
     * Surfaces expired and expiring-soon items prominently.
     */
    public function index(): Response
    {
        $expiredCount = Document::query()->expired()->count();
        $expiringSoonWeekCount = Document::query()->expiringSoon(7)->count();
        $expiringSoonMonthCount = Document::query()->expiringSoon(30)->count();

        $documents = Document::query()
            ->with(['documentType', 'documentable', 'uploader'])
            ->where(function ($q): void {
                $q->expired()->orWhere(fn($q2) => $q2->expiringSoon(30));
            })
            ->orderByRaw('expires_at ASC NULLS LAST')
            ->paginate(25);

        return Inertia::render('Modules/Document/Index', [
            'summary' => [
                'expired' => $expiredCount,
                'expiring_week' => $expiringSoonWeekCount,
                'expiring_month' => $expiringSoonMonthCount,
            ],
            'documents' => $documents,
        ]);
    }
}
