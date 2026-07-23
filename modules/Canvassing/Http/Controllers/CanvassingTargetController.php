<?php

namespace Modules\Canvassing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Canvassing\Models\CanvassingTarget;

class CanvassingTargetController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'salesperson_id' => ['required', 'integer', 'exists:salespeople,id'],
            'year' => ['required', 'integer', 'min:2020', 'max:2099'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'target_visits' => ['required', 'integer', 'min:0'],
            'target_new_partners' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        CanvassingTarget::query()->updateOrCreate(
            ['salesperson_id' => $data['salesperson_id'], 'year' => $data['year'], 'month' => $data['month']],
            $data
        );

        return redirect()->back()->with('success', 'Target saved.');
    }

    public function update(Request $request, CanvassingTarget $target): RedirectResponse
    {
        $data = $request->validate([
            'target_visits' => ['required', 'integer', 'min:0'],
            'target_new_partners' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $target->update($data);

        return redirect()->back()->with('success', 'Target updated.');
    }

    public function destroy(CanvassingTarget $target): RedirectResponse
    {
        $target->delete();

        return redirect()->back()->with('success', 'Target removed.');
    }
}
