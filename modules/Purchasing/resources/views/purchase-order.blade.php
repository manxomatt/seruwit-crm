<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>PO {{ $po->po_number }}</title>
    <style>
        @page { margin: 28px 36px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        .header { width: 100%; margin-bottom: 18px; }
        .header td { vertical-align: top; padding: 0; }
        .company-name { font-size: 15px; font-weight: bold; }
        .company-meta { color: #444; }
        .doc-title { font-size: 18px; letter-spacing: 2px; text-align: right; text-transform: uppercase; }
        .doc-meta { text-align: right; color: #444; }
        table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 2px 4px; vertical-align: top; }
        .meta .label { width: 110px; color: #555; }
        .items th, .items td { border: 1px solid #333; padding: 5px 6px; }
        .items th { background: #eee; text-align: left; font-size: 10px; text-transform: uppercase; }
        .items .num { width: 28px; text-align: center; }
        .items .qty, .items .amount { text-align: right; }
        .sign { margin-top: 36px; }
        .sign td { width: 33%; text-align: center; }
        .sign .space { height: 56px; }
        .sign .name { border-top: 1px solid #333; margin: 0 18px; padding-top: 4px; }
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
                <div class="doc-title">Purchase Order</div>
                <div class="doc-meta">{{ $po->po_number }}</div>
                <div class="doc-meta">Tanggal: {{ $po->ordered_at?->format('d/m/Y') }}</div>
                <div class="doc-meta">Status: {{ $po->status }}</div>
            </td>
        </tr>
    </table>

    <table class="meta">
        <tr><td class="label">Supplier</td><td>: {{ $po->partner?->name }} ({{ $po->partner?->code }})</td></tr>
        <tr><td class="label">Gudang</td><td>: {{ $po->warehouse?->name }}</td></tr>
    </table>

    <br>
    <table class="items">
        <thead>
            <tr>
                <th class="num">No</th>
                <th>Produk</th>
                <th>UOM</th>
                <th class="qty">Qty</th>
                <th class="amount">Harga</th>
                <th class="amount">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($po->items as $item)
                <tr>
                    <td class="num">{{ $loop->iteration }}</td>
                    <td>{{ $item->product?->name }}</td>
                    <td>{{ $item->unit ?? $item->packaging?->name ?? $item->product?->unit }}</td>
                    <td class="qty">{{ number_format((float) $item->quantity_ordered, 2, ',', '.') }}</td>
                    <td class="amount">{{ $currencySymbol }} {{ number_format((float) $item->unit_price, 0, ',', '.') }}</td>
                    <td class="amount">{{ $currencySymbol }} {{ number_format((float) $item->lineTotal(), 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p style="text-align:right;margin-top:10px;font-weight:bold;">
        Total: {{ $currencySymbol }} {{ number_format((float) $po->total_amount, 0, ',', '.') }}
    </p>

    @if ($po->notes)
        <p><strong>Catatan:</strong> {{ $po->notes }}</p>
    @endif

    <table class="sign">
        <tr>
            <td>Dibuat</td>
            <td>Disetujui</td>
            <td>Supplier</td>
        </tr>
        <tr><td class="space"></td><td class="space"></td><td class="space"></td></tr>
        <tr>
            <td><div class="name">{{ $po->createdBy?->name ?? '—' }}</div></td>
            <td><div class="name">&nbsp;</div></td>
            <td><div class="name">{{ $po->partner?->name }}</div></td>
        </tr>
    </table>
</body>
</html>
