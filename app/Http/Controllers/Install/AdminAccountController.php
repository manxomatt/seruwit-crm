<?php

namespace App\Http\Controllers\Install;

use App\Actions\Install\CreateCentralAdminAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Install\AdminAccountRequest;
use Illuminate\Http\RedirectResponse;

class AdminAccountController extends Controller
{
    public function store(AdminAccountRequest $request, CreateCentralAdminAction $action): RedirectResponse
    {
        $action->execute($request->adminData());

        return redirect()->route('install.index')->with('status', 'admin-created');
    }
}
