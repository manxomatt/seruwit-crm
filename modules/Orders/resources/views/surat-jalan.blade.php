<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat Jalan {{ $order->code }}</title>
    <style>
        @page { margin: 28px 36px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 18px; letter-spacing: 2px; margin: 0; text-align: center; text-transform: uppercase; }
        .subtitle { text-align: center; font-size: 11px; margin: 2px 0 16px; color: #444; }
        table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 3px 4px; vertical-align: top; }
        .meta .label { width: 110px; color: #555; }
        .meta .sep { width: 8px; }
        .items { margin-top: 14px; }
        .items th, .items td { border: 1px solid #333; padding: 5px 6px; }
        .items th { background: #eee; text-align: left; font-size: 10px; text-transform: uppercase; }
        .items .num { width: 28px; text-align: center; }
        .items .qty { width: 70px; text-align: right; }
        .items .unit { width: 60px; }
        .sign { margin-top: 28px; }
        .sign td { width: 33.33%; text-align: center; padding: 4px; }
        .sign .space { height: 64px; }
        .sign .name { border-top: 1px solid #333; margin: 0 24px; padding-top: 4px; }
        .notes { margin-top: 12px; color: #444; }
    </style>
</head>
<body>
    <h1>Surat Jalan</h1>
    <p class="subtitle">{{ $order->code }} &mdash; {{ $order->order_date?->format('d/m/Y') }}</p>

    <table class="meta">
        <tr>
            <td class="label">Pelanggan</td><td class="sep">:</td>
            <td>{{ $order->partner?->name }}</td>
            <td class="label">No. Trip</td><td class="sep">:</td>
            <td>{{ $order->trip?->code }}</td>
        </tr>
        <tr>
            <td class="label">Alamat Jemput</td><td class="sep">:</td>
            <td>{{ $order->pickup_address }}</td>
            <td class="label">Kendaraan</td><td class="sep">:</td>
            <td>{{ $order->trip?->vehicle?->name }} ({{ $order->trip?->vehicle?->plate_number }})</td>
        </tr>
        <tr>
            <td class="label">Alamat Tujuan</td><td class="sep">:</td>
            <td>{{ $stop?->address ?? $order->delivery_address }}</td>
            <td class="label">Pengemudi</td><td class="sep">:</td>
            <td>{{ $order->trip?->driver?->name }}</td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th class="num">No</th>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th class="qty">Jumlah</th>
                <th class="unit">Satuan</th>
                <th>Catatan</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr>
                    <td class="num">{{ $loop->iteration }}</td>
                    <td>{{ $item->product?->code }}</td>
                    <td>{{ $item->product?->name }}</td>
                    <td class="qty">{{ rtrim(rtrim(number_format((float) $item->quantity, 2, ',', '.'), '0'), ',') }}</td>
                    <td class="unit">{{ $item->product?->unit }}</td>
                    <td>{{ $item->notes }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if ($order->notes)
        <p class="notes"><strong>Catatan:</strong> {{ $order->notes }}</p>
    @endif

    <table class="sign">
        <tr>
            <td>Pengirim</td>
            <td>Pengemudi</td>
            <td>Penerima</td>
        </tr>
        <tr>
            <td class="space"></td>
            <td class="space"></td>
            <td class="space"></td>
        </tr>
        <tr>
            <td><div class="name">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div></td>
            <td><div class="name">@if ($order->trip?->driver?->name){{ $order->trip->driver->name }}@else(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)@endif</div></td>
            <td><div class="name">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div></td>
        </tr>
    </table>
</body>
</html>
