<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Support\Installer\InstallToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UnlockController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate(['token' => ['required', 'string']]);

        if (! InstallToken::matches($request->input('token'))) {
            return back()->withErrors(['token' => __('install.token.invalid')]);
        }

        $request->session()->put('installer_unlocked', true);

        return redirect()->route('install.index')->with('status', 'unlocked');
    }
}
