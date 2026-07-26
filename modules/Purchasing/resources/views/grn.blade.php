<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>GRN {{ $grn->grn_number }}</title>
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
        .meta td { padding: 2px 4px; }
        .meta .label { width: 120px; color: #555; }
        .items th, .items td { border: 1px solid #333; padding: 5px 6px; }
        .items th { background: #eee; text-align: left; font-size: 10px; text-transform: uppercase; }
        .items .num { width: 28px; text-align: center; }
        .items .qty { text-align: right; }
        .sign { margin-top: 36px; }
        .sign td { width: 50%; text-align: center; }
        .sign .space { height: 56px; }
        .sign .name { border-top: 1px solid #333; margin: 0 24px; padding-top: 4px; }
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
                <div class="doc-title">Good Receipt Note</div>
                <div class="doc-meta">{{ $grn->grn_number }}</div>
                <div class="doc-meta">Tanggal: {{ $grn->received_at?->format('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <table class="meta">
        <tr><td class="label">PO</td><td>: {{ $grn->purchaseOrder?->po_number }}</td></tr>
        <tr><td class="label">Supplier</td><td>: {{ $grn->purchaseOrder?->partner?->name }}</td></tr>
        <tr><td class="label">Gudang</td><td>: {{ $grn->warehouse?->name }}</td></tr>
        <tr><td class="label">Diterima oleh</td><td>: {{ $grn->receivedBy?->name ?? '—' }}</td></tr>
    </table>

    <br>
    <table class="items">
        <thead>
            <tr>
                <th class="num">No</th>
                <th>Produk</th>
                <th>Lokasi</th>
                <th>Batch</th>
                <th>Exp</th>
                <th class="qty">Qty</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($grn->items as $item)
                <tr>
                    <td class="num">{{ $loop->iteration }}</td>
                    <td>{{ $item->purchaseOrderItem?->product?->name }}</td>
                    <td>{{ $item->location?->code ?? '—' }}</td>
                    <td>{{ $item->batch_number ?: '—' }}</td>
                    <td>{{ $item->expiry_date?->format('d/m/Y') ?? '—' }}</td>
                    <td class="qty">{{ number_format((float) $item->quantity_received, 2, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="sign">
        <tr>
            <td>Penerima gudang</td>
            <td>Pengantar / Supplier</td>
        </tr>
        <tr><td class="space"></td><td class="space"></td></tr>
        <tr>
            <td><div class="name">{{ $grn->receivedBy?->name ?? '—' }}</div></td>
            <td><div class="name">&nbsp;</div></td>
        </tr>
    </table>
</body>
</html>
