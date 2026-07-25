<?php

namespace Modules\DriverScoring\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\DriverScoring\Models\DriverIncentiveAward;

class IncentiveAwardController extends Controller
{
    public function updateStatus(Request $request, DriverIncentiveAward $award): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([
                DriverIncentiveAward::STATUS_PENDING,
                DriverIncentiveAward::STATUS_APPROVED,
                DriverIncentiveAward::STATUS_PAID,
                DriverIncentiveAward::STATUS_REJECTED,
            ])],
        ]);

        $award->update(['status' => $data['status']]);

        return back()->with('success', __('scoring.messages.award_status_updated'));
    }
}
