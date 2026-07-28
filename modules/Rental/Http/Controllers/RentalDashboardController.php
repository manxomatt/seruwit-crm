<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Rental\Support\RentalStatusBoard;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RentalDashboardController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(RentalStatusBoard $board): Response
    {
        return Inertia::render('Modules/Rental/Dashboard/Index', [
            'board' => $board->build(),
            'exportUrl' => route($this->getRoutePrefix().'.rental.dashboard.export'),
        ]);
    }

    public function export(Request $request, RentalStatusBoard $board): StreamedResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['overdue', 'ending_soon', 'revenue_mtd', 'idle'])],
        ]);

        $snapshot = $board->build();
        $type = $validated['type'];
        $filename = sprintf('rental-%s-%s.csv', $type, now()->format('Ymd-His'));

        return response()->streamDownload(function () use ($snapshot, $type): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            match ($type) {
                'overdue', 'ending_soon' => $this->writeRentalRows($handle, $snapshot[$type] ?? []),
                'revenue_mtd' => $this->writeRevenueRows($handle, $snapshot['revenue']['by_vehicle'] ?? []),
                'idle' => $this->writeIdleRows($handle, $snapshot['idle_vehicles'] ?? []),
            };

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  resource  $handle
     * @param  list<array<string, mixed>>  $rows
     */
    private function writeRentalRows($handle, array $rows): void
    {
        fputcsv($handle, ['code', 'vehicle', 'plate', 'partner', 'start_date', 'end_date', 'status', 'total_amount']);

        foreach ($rows as $row) {
            fputcsv($handle, [
                $row['code'] ?? '',
                $row['vehicle']['name'] ?? '',
                $row['vehicle']['plate_number'] ?? '',
                $row['partner']['name'] ?? '',
                $row['start_date'] ?? '',
                $row['end_date'] ?? '',
                $row['status'] ?? '',
                $row['total_amount'] ?? 0,
            ]);
        }
    }

    /**
     * @param  resource  $handle
     * @param  list<array<string, mixed>>  $rows
     */
    private function writeRevenueRows($handle, array $rows): void
    {
        fputcsv($handle, ['vehicle', 'plate', 'bookings', 'total_amount']);

        foreach ($rows as $row) {
            fputcsv($handle, [
                $row['name'] ?? '',
                $row['plate_number'] ?? '',
                $row['count'] ?? 0,
                $row['total'] ?? 0,
            ]);
        }
    }

    /**
     * @param  resource  $handle
     * @param  list<array<string, mixed>>  $rows
     */
    private function writeIdleRows($handle, array $rows): void
    {
        fputcsv($handle, ['vehicle', 'plate', 'type']);

        foreach ($rows as $row) {
            fputcsv($handle, [
                $row['name'] ?? '',
                $row['plate_number'] ?? '',
                $row['type'] ?? '',
            ]);
        }
    }
}
