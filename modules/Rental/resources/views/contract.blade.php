<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Perjanjian Sewa {{ $rental->code }}</title>
    <style>
        @page { margin: 28px 36px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; line-height: 1.45; }
        h1 { font-size: 16px; letter-spacing: 1px; margin: 0; text-align: center; text-transform: uppercase; }
        .subtitle { text-align: center; font-size: 11px; margin: 2px 0 14px; color: #444; }
        .company { text-align: center; margin-bottom: 12px; font-size: 10px; color: #555; }
        table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 3px 4px; vertical-align: top; }
        .meta .label { width: 120px; color: #555; }
        .meta .sep { width: 8px; }
        .box { margin-top: 12px; border: 1px solid #333; padding: 8px 10px; }
        .box h2 { font-size: 12px; margin: 0 0 6px; text-transform: uppercase; }
        .terms { margin-top: 12px; }
        .terms li { margin-bottom: 4px; }
        .sign { margin-top: 28px; }
        .sign td { width: 50%; text-align: center; padding: 4px; }
        .sign .space { height: 64px; }
        .sign .name { border-top: 1px solid #333; margin: 0 28px; padding-top: 4px; }
        .money { font-weight: bold; }
    </style>
</head>
<body>
    <div class="company">
        <strong>{{ $company['name'] }}</strong>
        @if ($company['address'])<br>{{ $company['address'] }}@endif
        @if ($company['phone'])<br>{{ $company['phone'] }}@endif
    </div>

    <h1>Perjanjian Sewa Kendaraan</h1>
    <p class="subtitle">{{ $rental->code }} &mdash; {{ now()->format('d/m/Y') }}</p>

    <table class="meta">
        <tr>
            <td class="label">Penyewa</td><td class="sep">:</td>
            <td>{{ $rental->partner?->name }}</td>
            <td class="label">Kode Partner</td><td class="sep">:</td>
            <td>{{ $rental->partner?->code }}</td>
        </tr>
        <tr>
            <td class="label">Telepon</td><td class="sep">:</td>
            <td>{{ $rental->partner?->phone ?? '—' }}</td>
            <td class="label">Status</td><td class="sep">:</td>
            <td>{{ strtoupper($rental->status) }}</td>
        </tr>
        <tr>
            <td class="label">Kendaraan</td><td class="sep">:</td>
            <td>{{ $rental->vehicle?->name }} ({{ $rental->vehicle?->plate_number }})</td>
            <td class="label">Tipe</td><td class="sep">:</td>
            <td>{{ $rental->vehicle?->type ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">Periode</td><td class="sep">:</td>
            <td>{{ $rental->start_date?->format('d/m/Y') }} &rarr; {{ $rental->end_date?->format('d/m/Y') }}</td>
            <td class="label">Durasi</td><td class="sep">:</td>
            <td>{{ $rental->total_periods }} {{ $rental->period_type }}</td>
        </tr>
        @if ($rental->driver)
            <tr>
                <td class="label">Driver</td><td class="sep">:</td>
                <td colspan="4">{{ $rental->driver->name }} {{ $rental->driver->phone ? '('.$rental->driver->phone.')' : '' }}</td>
            </tr>
        @endif
    </table>

    <div class="box">
        <h2>Ringkasan Biaya</h2>
        <table class="meta">
            <tr>
                <td class="label">Tarif / periode</td><td class="sep">:</td>
                <td class="money">Rp {{ number_format((float) $rental->rate_per_period, 0, ',', '.') }}</td>
                <td class="label">Deposit</td><td class="sep">:</td>
                <td class="money">Rp {{ number_format((float) $rental->deposit_amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="label">Jumlah dasar</td><td class="sep">:</td>
                <td class="money">Rp {{ number_format((float) $rental->base_amount, 0, ',', '.') }}</td>
                <td class="label">Total</td><td class="sep">:</td>
                <td class="money">Rp {{ number_format((float) $rental->total_amount, 0, ',', '.') }}</td>
            </tr>
            @if ($rental->km_limit_per_period)
                <tr>
                    <td class="label">Batas KM</td><td class="sep">:</td>
                    <td>{{ number_format((int) $rental->km_limit_per_period) }} km / periode</td>
                    <td class="label">Tarif KM lebih</td><td class="sep">:</td>
                    <td>Rp {{ number_format((float) ($rental->excess_km_rate ?? 0), 0, ',', '.') }} / km</td>
                </tr>
            @endif
            <tr>
                <td class="label">Lokasi jemput</td><td class="sep">:</td>
                <td>{{ $rental->pickup_location ?: '—' }}</td>
                <td class="label">Lokasi kembali</td><td class="sep">:</td>
                <td>{{ $rental->return_location ?: '—' }}</td>
            </tr>
            @if ($rental->fuel_policy_notes)
                <tr>
                    <td class="label">Kebijakan BBM</td><td class="sep">:</td>
                    <td colspan="4">{{ $rental->fuel_policy_notes }}</td>
                </tr>
            @endif
            @if ($rental->late_fee_per_day !== null || $rental->period_type === 'daily')
                <tr>
                    <td class="label">Denda / hari</td><td class="sep">:</td>
                    <td colspan="4">Rp {{ number_format((float) ($rental->late_fee_per_day ?? ($rental->period_type === 'daily' ? $rental->rate_per_period : 0)), 0, ',', '.') }}</td>
                </tr>
            @endif
        </table>
    </div>

    <div class="terms">
        <strong>Ketentuan singkat:</strong>
        <ol>
            <li>Penyewa bertanggung jawab atas kondisi kendaraan selama masa sewa.</li>
            <li>Kerusakan, kehilangan, dan kelebihan kilometer ditagihkan sesuai tarif yang berlaku.</li>
            <li>Deposit dapat dipotong untuk biaya kerusakan / tagihan tertunggak, sisanya dikembalikan setelah settlement.</li>
            <li>Kendaraan dikembalikan sesuai tanggal perjanjian kecuali diperpanjang secara tertulis.</li>
            <li>Serah terima dicatat pada berita acara checkout / return.</li>
        </ol>
    </div>

    @if ($rental->notes)
        <p><strong>Catatan:</strong> {{ $rental->notes }}</p>
    @endif

    <table class="sign">
        <tr>
            <td>
                <div class="space"></div>
                <div class="name">{{ $company['name'] }}<br><span style="font-size:10px;color:#666;">Pihak Penyedia</span></div>
            </td>
            <td>
                <div class="space"></div>
                <div class="name">{{ $rental->partner?->name }}<br><span style="font-size:10px;color:#666;">Penyewa</span></div>
            </td>
        </tr>
    </table>
</body>
</html>
