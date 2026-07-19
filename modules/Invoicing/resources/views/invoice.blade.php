<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->code }}</title>
    <style>
        @page { margin: 28px 36px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        .header { width: 100%; margin-bottom: 18px; }
        .header td { vertical-align: top; padding: 0; }
        .company-name { font-size: 15px; font-weight: bold; }
        .company-meta { color: #444; }
        .doc-title { font-size: 20px; letter-spacing: 3px; text-align: right; text-transform: uppercase; }
        .doc-meta { text-align: right; color: #444; }
        .stamp { display: inline-block; border: 2px solid #15803d; color: #15803d; font-weight: bold; padding: 2px 10px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; }
        .billto { margin-bottom: 14px; }
        .billto td { padding: 2px 4px; vertical-align: top; }
        .billto .label { width: 110px; color: #555; }
        .items th, .items td { border: 1px solid #333; padding: 5px 6px; }
        .items th { background: #eee; text-align: left; font-size: 10px; text-transform: uppercase; }
        .items .num { width: 28px; text-align: center; }
        .items .amount { width: 110px; text-align: right; }
        .totals { width: 45%; margin-left: 55%; margin-top: 10px; }
        .totals td { padding: 3px 6px; }
        .totals .label { color: #555; }
        .totals .value { text-align: right; }
        .totals .grand td { border-top: 1px solid #333; font-weight: bold; }
        .notes { margin-top: 12px; color: #444; }
        .sign { margin-top: 32px; }
        .sign td { width: 60%; }
        .sign .box { width: 40%; text-align: center; }
        .sign .space { height: 64px; }
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
                <div class="doc-title">Invoice</div>
                <div class="doc-meta">{{ $invoice->code }}</div>
                <div class="doc-meta">Tanggal: {{ $invoice->issue_date?->format('d/m/Y') }}</div>
                @if ($invoice->due_date)
                    <div class="doc-meta">Jatuh tempo: {{ $invoice->due_date->format('d/m/Y') }}</div>
                @endif
                @if ($invoice->status === \Modules\Invoicing\Models\Invoice::STATUS_PAID)
                    <div style="text-align: right;"><span class="stamp">LUNAS</span></div>
                @endif
            </td>
        </tr>
    </table>

    <table class="billto">
        <tr>
            <td class="label">Ditagihkan kepada</td>
            <td>: {{ $invoice->customer?->name }} ({{ $invoice->customer?->code }})</td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th class="num">No</th>
                {{-- The line's own description, not the order behind it: an issued
                     invoice must keep saying what it said when it was issued, and
                     the module that raised the line may not even be installed. --}}
                <th>Keterangan</th>
                <th class="amount">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->lines as $line)
                <tr>
                    <td class="num">{{ $loop->iteration }}</td>
                    <td>{{ $line->description }}</td>
                    <td class="amount">{{ $currencySymbol }} {{ number_format((float) $line->amount, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="label">Subtotal</td>
            <td class="value">{{ $currencySymbol }} {{ number_format((float) $invoice->subtotal, 0, ',', '.') }}</td>
        </tr>
        @if ($invoice->tax_enabled)
            <tr>
                <td class="label">PPN ({{ rtrim(rtrim(number_format((float) $invoice->tax_rate, 2, ',', '.'), '0'), ',') }}%)</td>
                <td class="value">{{ $currencySymbol }} {{ number_format((float) $invoice->tax_amount, 0, ',', '.') }}</td>
            </tr>
        @endif
        <tr class="grand">
            <td class="label">Total</td>
            <td class="value">{{ $currencySymbol }} {{ number_format((float) $invoice->total, 0, ',', '.') }}</td>
        </tr>
    </table>

    @if ($invoice->notes)
        <p class="notes"><strong>Catatan:</strong> {{ $invoice->notes }}</p>
    @endif

    <table class="sign">
        <tr>
            <td></td>
            <td class="box">Hormat kami,</td>
        </tr>
        <tr>
            <td></td>
            <td class="box space"></td>
        </tr>
        <tr>
            <td></td>
            <td class="box"><div class="name">{{ $company['name'] }}</div></td>
        </tr>
    </table>
</body>
</html>
