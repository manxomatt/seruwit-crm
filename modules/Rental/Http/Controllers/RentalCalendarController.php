<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Rental\Support\RentalCalendarOptions;
use Modules\Rental\Support\RentalUsageCalendar;

class RentalCalendarController extends Controller
{
    public function index(Request $request, RentalUsageCalendar $calendar): Response
    {
        $view = (string) $request->input('view', RentalUsageCalendar::VIEW_WEEK);
        if (! in_array($view, RentalUsageCalendar::views(), true)) {
            $view = RentalUsageCalendar::VIEW_WEEK;
        }

        $date = Carbon::parse($request->input('date', now()->toDateString()))->toDateString();

        return Inertia::render('Modules/Rental/Calendar/Index', [
            'board' => $calendar->build($view, $date),
            'calendarClickToBook' => RentalCalendarOptions::clickToBookEnabled(),
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
