<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLocaleRequest;
use App\Support\LocaleResolver;
use Illuminate\Http\RedirectResponse;

class LocaleController extends Controller
{
    public function update(UpdateLocaleRequest $request, LocaleResolver $locales): RedirectResponse
    {
        $locales->persist($request, $request->validated('locale'));

        return back();
    }
}
