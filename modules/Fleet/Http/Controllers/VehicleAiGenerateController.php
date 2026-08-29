<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Fleet\AI\Contracts\VehicleAiGeneratorServiceInterface;
use Throwable;

class VehicleAiGenerateController extends Controller
{
    public function __construct(
        protected readonly VehicleAiGeneratorServiceInterface $aiGenerator,
    ) {}

    /**
     * Parse unstructured vehicle text prompt and return normalized attributes.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'min:3', 'max:5000'],
            'bases' => ['nullable', 'array'],
            'bases.*.id' => ['nullable', 'integer'],
            'bases.*.name' => ['nullable', 'string'],
            'bases.*.code' => ['nullable', 'string'],
        ]);

        try {
            $extractedData = $this->aiGenerator->generateFromText(
                $validated['text'],
                $validated['bases'] ?? []
            );

            return response()->json([
                'success' => true,
                'data' => $extractedData,
                'message' => 'Spesifikasi kendaraan berhasil di-generate secara otomatis.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses data AI: '.$e->getMessage(),
            ], 422);
        }
    }
}
