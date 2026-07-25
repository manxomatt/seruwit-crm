<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    /**
     * Search across core features and every installed module the user can view.
     */
    public function search(Request $request, GlobalSearchService $search): JsonResponse
    {
        $query = (string) $request->get('q', '');

        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'results' => $search->search($user, $query),
            'query' => $query,
        ]);
    }
}
