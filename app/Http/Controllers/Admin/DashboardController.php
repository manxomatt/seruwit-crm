<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalUsers' => 1250,
                'totalPages' => 48,
                'totalViews' => 125000,
                'revenue' => 52400,
            ],
            'recentActivity' => [
                [
                    'id' => 1,
                    'type' => 'page_created',
                    'description' => 'New page "About Us" was created',
                    'time' => '2 hours ago',
                ],
                [
                    'id' => 2,
                    'type' => 'user_registered',
                    'description' => 'New user John Doe registered',
                    'time' => '4 hours ago',
                ],
                [
                    'id' => 3,
                    'type' => 'page_updated',
                    'description' => 'Page "Contact" was updated',
                    'time' => '6 hours ago',
                ],
                [
                    'id' => 4,
                    'type' => 'order_completed',
                    'description' => 'Order #1234 was completed',
                    'time' => '8 hours ago',
                ],
            ],
        ]);
    }
}
