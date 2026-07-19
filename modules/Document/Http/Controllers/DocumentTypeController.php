<?php

namespace Modules\Document\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Document\Models\DocumentType;

class DocumentTypeController extends Controller
{
    /**
     * List all document types for the workspace admin to review and customize.
     */
    public function index(): Response
    {
        $types = DocumentType::query()
            ->orderBy('entity_type')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Modules/Document/Types/Index', [
            'types' => $types,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'entity_type' => ['required', 'in:vehicle,driver'],
            'key' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:document_types,key'],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_required' => ['boolean'],
            'has_expiry' => ['boolean'],
            'typical_validity_days' => ['nullable', 'integer', 'min:1'],
            'reminder_days' => ['present', 'array'],
            'reminder_days.*' => ['integer', 'min:1'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        DocumentType::query()->create($validated);

        return back()->with('success', 'Document type created.');
    }

    public function update(Request $request, DocumentType $type): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_required' => ['boolean'],
            'has_expiry' => ['boolean'],
            'typical_validity_days' => ['nullable', 'integer', 'min:1'],
            'reminder_days' => ['present', 'array'],
            'reminder_days.*' => ['integer', 'min:1'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $type->update($validated);

        return back()->with('success', 'Document type updated.');
    }

    public function destroy(DocumentType $type): RedirectResponse
    {
        if ($type->documents()->exists()) {
            return back()->with('error', 'Cannot delete a document type that has existing documents.');
        }

        $type->delete();

        return back()->with('success', 'Document type deleted.');
    }
}
