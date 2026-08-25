<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Support\Installer\RequirementsChecker;
use Illuminate\Http\JsonResponse;

class RequirementController extends Controller
{
    public function index(RequirementsChecker $checker): JsonResponse
    {
        return response()->json([
            'checks' => $checker->checks(),
            'passes' => $checker->passes(),
        ]);
    }
}
