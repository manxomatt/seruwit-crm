<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Job Card {{ $workOrder->reference_number }}</title>
    <style>
        @page { margin: 16px 18px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #111; }
        .header { width: 100%; margin-bottom: 10px; }
        .header td { vertical-align: top; padding: 0; }
        .company-name { font-size: 13px; font-weight: bold; }
        .company-meta { color: #444; font-size: 9px; }
        .doc-title { font-size: 16px; letter-spacing: 1px; text-align: right; text-transform: uppercase; font-weight: bold; }
        .doc-meta { text-align: right; color: #444; }
        table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 1px 2px; vertical-align: top; }
        .meta .label { width: 90px; color: #555; }
        .section { margin-top: 10px; }
        .section-title { font-size: 11px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; margin-bottom: 4px; text-transform: uppercase; }
        .items th, .items td { border: 1px solid #333; padding: 3px 4px; }
        .items th { background: #eee; text-align: left; font-size: 9px; text-transform: uppercase; }
        .items .num { width: 22px; text-align: center; }
        .check { width: 18px; text-align: center; }
        .box { display: inline-block; width: 10px; height: 10px; border: 1px solid #333; }
        .done { background: #111; }
        .sign { margin-top: 18px; }
        .sign td { width: 50%; text-align: center; }
        .sign .space { height: 42px; }
        .sign .name { border-top: 1px solid #333; margin: 0 16px; padding-top: 3px; }
        .notes { margin-top: 8px; color: #333; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <div class="company-name">{{ $company['name'] }}</div>
                <div class="company-meta">{{ $company['address'] }}</div>
                <div class="company-meta">{{ $company['phone'] }}</div>
            </td>
            <td>
                <div class="doc-title">Job Card</div>
                <div class="doc-meta">{{ $workOrder->reference_number }}</div>
                <div class="doc-meta">{{ __('maintenance.status.'.$workOrder->status) }}</div>
            </td>
        </tr>
    </table>

    <table class="meta">
        <tr>
            <td class="label">{{ __('maintenance.work_orders.columns.vehicle') }}</td>
            <td>: {{ $workOrder->vehicle?->plate_number }} — {{ $workOrder->vehicle?->name }}</td>
        </tr>
        <tr>
            <td class="label">{{ __('maintenance.work_orders.columns.job') }}</td>
            <td>: {{ $workOrder->title }}</td>
        </tr>
        <tr>
            <td class="label">{{ __('maintenance.work_orders.category') }}</td>
            <td>: {{ $workOrder->category?->name }}</td>
        </tr>
        <tr>
            <td class="label">{{ __('maintenance.work_orders.bay') }}</td>
            <td>: {{ $workOrder->bay ? $workOrder->bay->code.' — '.$workOrder->bay->name : '—' }}</td>
        </tr>
        <tr>
            <td class="label">{{ __('maintenance.work_orders.mechanic') }}</td>
            <td>: {{ $workOrder->mechanic?->name ?? $workOrder->mechanic_name ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">{{ __('maintenance.work_orders.schedule') }}</td>
            <td>: {{ $workOrder->scheduled_date?->format('d/m/Y') ?? '—' }}
                @if ($workOrder->estimated_hours)
                    · {{ $workOrder->estimated_hours }} jam
                @endif
            </td>
        </tr>
        @if ($workOrder->odometer_at_service)
            <tr>
                <td class="label">Odometer</td>
                <td>: {{ number_format((int) $workOrder->odometer_at_service) }} km</td>
            </tr>
        @endif
    </table>

    @if ($workOrder->description)
        <div class="notes"><strong>{{ __('maintenance.work_orders.description') }}:</strong> {{ $workOrder->description }}</div>
    @endif

    <div class="section">
        <div class="section-title">{{ __('maintenance.checklist.head') }}</div>
        @if ($workOrder->checklistItems->isEmpty())
            <div style="color:#666;">—</div>
        @else
            <table class="items">
                <thead>
                    <tr>
                        <th class="check"></th>
                        <th class="num">No</th>
                        <th>{{ __('maintenance.checklist.label') }}</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($workOrder->checklistItems as $item)
                        <tr>
                            <td class="check"><span class="box {{ $item->is_done ? 'done' : '' }}"></span></td>
                            <td class="num">{{ $loop->iteration }}</td>
                            <td>{{ $item->label }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    </div>

    <div class="section">
        <div class="section-title">{{ __('maintenance.work_orders.details') }}</div>
        @if ($workOrder->items->isEmpty())
            <div style="color:#666;">—</div>
        @else
            <table class="items">
                <thead>
                    <tr>
                        <th class="num">No</th>
                        <th>{{ __('maintenance.work_orders.item_columns.name') }}</th>
                        <th>{{ __('maintenance.work_orders.item_columns.qty') }}</th>
                        <th>{{ __('maintenance.work_orders.item_columns.unit') }}</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($workOrder->items as $item)
                        <tr>
                            <td class="num">{{ $loop->iteration }}</td>
                            <td>{{ $item->name }}</td>
                            <td>{{ $item->quantity }}</td>
                            <td>{{ $item->unit ?? '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    </div>

    <table class="sign">
        <tr>
            <td>
                <div class="space"></div>
                <div class="name">{{ __('maintenance.job_card.mechanic_sign') }}</div>
            </td>
            <td>
                <div class="space"></div>
                <div class="name">{{ __('maintenance.job_card.supervisor_sign') }}</div>
            </td>
        </tr>
    </table>
</body>
</html>
