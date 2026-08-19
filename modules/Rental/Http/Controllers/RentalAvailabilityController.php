<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\Support\RentalAvailabilityBoard;

class RentalAvailabilityController extends Controller
{
    public function index(Request $request, RentalAvailabilityBoard $board): Response
    {
        $from = $request->input('from', now()->toDateString());
        $to = $request->input('to', now()->addDays(13)->toDateString());

        if (Carbon::parse($to)->lt(Carbon::parse($from))) {
            $to = $from;
        }

        return Inertia::render('Modules/Rental/Availability/Index', [
            'board' => $board->build($from, $to),
            'filters' => [
                'from' => Carbon::parse($from)->toDateString(),
                'to' => Carbon::parse($to)->toDateString(),
            ],
            'rentalClasses' => collect(VehicleRentalClass::values())
                ->map(fn (string $value): array => [
                    'value' => $value,
                    'label' => VehicleRentalClass::label($value),
                ])
                ->values()
                ->all(),
        ]);
    }
}
