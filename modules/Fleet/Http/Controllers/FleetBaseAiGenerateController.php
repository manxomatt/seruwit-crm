<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Fleet\AI\Contracts\FleetBaseAiGeneratorServiceInterface;
use Throwable;

class FleetBaseAiGenerateController extends Controller
{
    public function __construct(
        protected readonly FleetBaseAiGeneratorServiceInterface $aiGenerator,
    ) {}

    /**
     * Parse unstructured fleet base/pool text prompt and return normalized attributes.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'min:3', 'max:5000'],
            'managers' => ['nullable', 'array'],
            'managers.*.id' => ['nullable', 'integer'],
            'managers.*.name' => ['nullable', 'string'],
            'managers.*.email' => ['nullable', 'string'],
        ]);

        try {
            $extractedData = $this->aiGenerator->generateFromText(
                $validated['text'],
                $validated['managers'] ?? []
            );

            return response()->json([
                'success' => true,
                'data' => $extractedData,
                'message' => 'Spesifikasi base/pool berhasil di-generate secara otomatis.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses data AI: '.$e->getMessage(),
            ], 422);
        }
    }
}
