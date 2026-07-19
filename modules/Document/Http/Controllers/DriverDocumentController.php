<?php

namespace Modules\Document\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Driver;

class DriverDocumentController extends Controller
{
    /**
     * All documents for a driver, grouped by type, with full history.
     */
    public function index(Driver $driver): Response
    {
        $types = DocumentType::query()
            ->where('entity_type', DocumentType::ENTITY_DRIVER)
            ->orderBy('sort_order')
            ->get();

        $documents = Document::query()
            ->withTrashed()
            ->where('documentable_type', 'driver')
            ->where('documentable_id', $driver->id)
            ->with(['documentType', 'media', 'uploader', 'verifier'])
            ->orderBy('document_type_id')
            ->orderByDesc('created_at')
            ->get();

        $user = Auth::user();

        return Inertia::render('Modules/Document/Driver/Index', [
            'driver' => $driver,
            'types' => $types,
            'documents' => $documents,
            'can' => [
                'create' => $user->hasPermissionFor('document', 'create'),
                'update' => $user->hasPermissionFor('document', 'update'),
                'delete' => $user->hasPermissionFor('document', 'delete'),
                'verify' => $user->hasPermissionFor('document', 'verify'),
            ],
        ]);
    }

    public function create(Driver $driver): Response
    {
        $types = DocumentType::query()
            ->where('entity_type', DocumentType::ENTITY_DRIVER)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Modules/Document/Driver/Create', [
            'driver' => $driver,
            'types' => $types,
        ]);
    }

    public function store(Request $request, Driver $driver): RedirectResponse
    {
        $validated = $request->validate([
            'document_type_id' => ['required', 'exists:document_types,id'],
            'document_number' => ['nullable', 'string', 'max:100'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'notes' => ['nullable', 'string'],
            'media_id' => ['nullable', 'exists:media,id'],
        ]);

        // Soft-delete any existing active document of the same type for this
        // driver — it becomes "superseded" by the new upload.
        Document::query()
            ->where('documentable_type', 'driver')
            ->where('documentable_id', $driver->id)
            ->where('document_type_id', $validated['document_type_id'])
            ->delete();

        $driver->documents()->create([
            ...$validated,
            'uploaded_by' => Auth::id(),
        ]);

        return redirect()->route('fleet.drivers.documents.index', $driver)
            ->with('success', 'Document uploaded successfully.');
    }

    public function show(Driver $driver, Document $document): Response
    {
        $document->load(['documentType', 'media', 'uploader', 'verifier']);

        $history = Document::query()
            ->withTrashed()
            ->where('documentable_type', 'driver')
            ->where('documentable_id', $driver->id)
            ->where('document_type_id', $document->document_type_id)
            ->where('id', '!=', $document->id)
            ->with(['uploader'])
            ->orderByDesc('created_at')
            ->get();

        $user = Auth::user();

        return Inertia::render('Modules/Document/Driver/Show', [
            'driver' => $driver,
            'document' => $document,
            'history' => $history,
            'can' => [
                'update' => $user->hasPermissionFor('document', 'update'),
                'delete' => $user->hasPermissionFor('document', 'delete'),
                'verify' => $user->hasPermissionFor('document', 'verify'),
            ],
        ]);
    }

    public function update(Request $request, Driver $driver, Document $document): RedirectResponse
    {
        $validated = $request->validate([
            'document_number' => ['nullable', 'string', 'max:100'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'notes' => ['nullable', 'string'],
            'media_id' => ['nullable', 'exists:media,id'],
        ]);

        $document->update($validated);

        return back()->with('success', 'Document updated.');
    }

    public function destroy(Driver $driver, Document $document): RedirectResponse
    {
        $document->delete();

        return redirect()->route('fleet.drivers.documents.index', $driver)
            ->with('success', 'Document removed.');
    }

    public function verify(Driver $driver, Document $document): RedirectResponse
    {
        $document->update([
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Document marked as verified.');
    }
}
