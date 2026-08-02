<?php

namespace Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Product\Support\ProductStatusBoard;

class ProductDashboardController extends Controller
{
    public function index(ProductStatusBoard $board): Response
    {
        $user = Auth::user();

        return Inertia::render('Modules/Product/Dashboard/Index', [
            'board' => $board->build(),
            'can' => [
                'create' => $user->hasPermissionFor('products', 'create'),
            ],
        ]);
    }
}
