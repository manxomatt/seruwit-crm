<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $template['content']['title'] ?? 'Berita Acara Serah Terima' }} {{ $rental->code }}</title>
    <style>
        @page { margin: 28px 36px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 16px; letter-spacing: 1px; margin: 0; text-align: center; text-transform: uppercase; }
        .subtitle { text-align: center; font-size: 11px; margin: 2px 0 14px; color: #444; }
        .company { text-align: center; margin-bottom: 10px; font-size: 10px; color: #555; }
        table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 3px 4px; vertical-align: top; }
        .meta .label { width: 120px; color: #555; }
        .meta .sep { width: 8px; }
        h2 { font-size: 12px; margin: 16px 0 6px; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 3px; }
        .check { margin-top: 6px; }
        .check th, .check td { border: 1px solid #333; padding: 4px 6px; }
        .check th { background: #eee; text-align: left; font-size: 10px; text-transform: uppercase; }
        .check .ok { width: 70px; text-align: center; }
        .sign { margin-top: 24px; }
        .sign td { width: 50%; text-align: center; padding: 4px; }
        .sign .space { height: 56px; }
        .sign .name { border-top: 1px solid #333; margin: 0 28px; padding-top: 4px; }
        .notes { margin-top: 8px; color: #444; }
    </style>
</head>
<body>
    @if(($template['options']['show_company_info'] ?? true) || ($template['options']['show_logo'] ?? true) || ($template['options']['show_address'] ?? true) || ($template['options']['show_phone'] ?? true))
        <div class="company">
            <strong>{{ $company['name'] }}</strong>
            @if (($template['options']['show_address'] ?? true) && $company['address'])<br>{{ $company['address'] }}@endif
        </div>
    @endif

    <h1>{{ $template['content']['title'] ?? 'Berita Acara Serah Terima' }}</h1>
    <p class="subtitle">{{ $template['content']['subtitle'] ?? ($rental->code.' &mdash; '.$rental->vehicle?->name.' ('.$rental->vehicle?->plate_number.')') }}</p>

    <table class="meta">
        <tr>
            <td class="label">Penyewa</td><td class="sep">:</td>
            <td>{{ $rental->partner?->name }}</td>
            <td class="label">Periode</td><td class="sep">:</td>
            <td>{{ $rental->start_date?->format('d/m/Y') }} &rarr; {{ $rental->end_date?->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <td class="label">Driver</td><td class="sep">:</td>
            <td>{{ $rental->driver?->name ?? '—' }}</td>
            <td class="label">Status</td><td class="sep">:</td>
            <td>{{ strtoupper($rental->status) }}</td>
        </tr>
    </table>

    <h2>{{ $template['content']['checkout_label'] ?? 'Checkout (Serah ke Penyewa)' }}</h2>
    <table class="meta">
        <tr>
            <td class="label">Waktu</td><td class="sep">:</td>
            <td>{{ $rental->checked_out_at?->format('d/m/Y H:i') ?? '—' }}</td>
            <td class="label">Odometer</td><td class="sep">:</td>
            <td>{{ $rental->start_odometer !== null ? number_format((int) $rental->start_odometer).' km' : '—' }}</td>
        </tr>
        <tr>
            <td class="label">BBM</td><td class="sep">:</td>
            <td colspan="4">{{ $rental->start_fuel_level ? __('rental.fuel.'.$rental->start_fuel_level) : '—' }}</td>
        </tr>
    </table>

    @php($checkout = is_array($rental->checkout_checklist) ? $rental->checkout_checklist : [])
    <table class="check">
        <thead>
            <tr>
                <th>Item kondisi</th>
                <th class="ok">OK</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($checklistLabels as $key => $label)
                <tr>
                    <td>{{ $label }}</td>
                    <td class="ok">{{ ! empty($checkout[$key]) ? 'Ya' : 'Tidak' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    @if ($rental->checkout_notes)
        <p class="notes"><strong>Catatan checkout:</strong> {{ $rental->checkout_notes }}</p>
    @endif

    @if ($rental->returned_at)
        <h2>{{ $template['content']['return_label'] ?? 'Return (Kembali dari Penyewa)' }}</h2>
        <table class="meta">
            <tr>
                <td class="label">Waktu</td><td class="sep">:</td>
                <td>{{ $rental->returned_at?->format('d/m/Y H:i') }}</td>
                <td class="label">Odometer</td><td class="sep">:</td>
                <td>{{ $rental->end_odometer !== null ? number_format((int) $rental->end_odometer).' km' : '—' }}</td>
            </tr>
            <tr>
                <td class="label">BBM</td><td class="sep">:</td>
                <td>{{ $rental->end_fuel_level ? __('rental.fuel.'.$rental->end_fuel_level) : '—' }}</td>
                <td class="label">KM lebih</td><td class="sep">:</td>
                <td>{{ $rental->excess_km !== null ? number_format((int) $rental->excess_km).' km' : '—' }}</td>
            </tr>
        </table>

        @php($return = is_array($rental->return_checklist) ? $rental->return_checklist : [])
        <table class="check">
            <thead>
                <tr>
                    <th>Item kondisi</th>
                    <th class="ok">OK</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($checklistLabels as $key => $label)
                    <tr>
                        <td>{{ $label }}</td>
                        <td class="ok">{{ ! empty($return[$key]) ? 'Ya' : 'Tidak' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        @if ($rental->return_notes)
            <p class="notes"><strong>Catatan return:</strong> {{ $rental->return_notes }}</p>
        @endif
    @endif

    @if (($template['options']['show_damage_section'] ?? true) && $rental->damages->isNotEmpty())
        <h2>Damage</h2>
        <table class="check">
            <thead>
                <tr>
                    <th>Deskripsi</th>
                    <th style="width:120px;text-align:right;">Biaya</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rental->damages as $damage)
                    <tr>
                        <td>{{ $damage->description }}</td>
                        <td style="text-align:right;">Rp {{ number_format((float) $damage->amount, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if (($template['options']['show_signature'] ?? true))
        <table class="sign">
            <tr>
                <td>
                    @php($staffSig = $rental->checkout_signature_path)
                    @if ($staffSig && \Illuminate\Support\Facades\Storage::disk('public')->exists($staffSig) && @getimagesize(\Illuminate\Support\Facades\Storage::disk('public')->path($staffSig)))
                        <div class="space"><img src="data:image/png;base64,{{ base64_encode(\Illuminate\Support\Facades\Storage::disk('public')->get($staffSig)) }}" style="max-height:56px;max-width:180px;" alt="Signature"></div>
                    @else
                        <div class="space"></div>
                    @endif
                    <div class="name">{{ $company['name'] }}<br><span style="font-size:10px;color:#666;">Petugas</span></div>
                </td>
                <td>
                    @php($customerSig = $rental->return_signature_path ?: $rental->checkout_signature_path)
                    @if ($customerSig && \Illuminate\Support\Facades\Storage::disk('public')->exists($customerSig) && @getimagesize(\Illuminate\Support\Facades\Storage::disk('public')->path($customerSig)))
                        <div class="space"><img src="data:image/png;base64,{{ base64_encode(\Illuminate\Support\Facades\Storage::disk('public')->get($customerSig)) }}" style="max-height:56px;max-width:180px;" alt="Signature"></div>
                    @else
                        <div class="space"></div>
                    @endif
                    <div class="name">{{ $rental->partner?->name }}<br><span style="font-size:10px;color:#666;">Penyewa</span></div>
                </td>
            </tr>
        </table>
    @endif

    @if (!empty($template['content']['footer_html']))
        <div style="margin-top: 12px;">{!! $template['content']['footer_html'] !!}</div>
    @endif
</body>
</html>
