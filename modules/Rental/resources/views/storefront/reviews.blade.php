@php
    $brand = 'var(--brand-primary, #0f766e)';
@endphp
<section style="padding: 48px 16px; background: #ffffff;">
    <div style="max-width: 1120px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 28px;">
            <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: {{ $brand }};">Kata Mereka</span>
            <h2 style="margin: 6px 0 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a;">Dipercaya Pelanggan Kami</h2>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
            @foreach ($items as $item)
                <figure style="margin: 0; display: flex; flex-direction: column; gap: 12px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; padding: 20px;">
                    <div style="color: #f59e0b; font-size: 15px; letter-spacing: 2px;" aria-label="{{ $item['rating'] }} dari 5">
                        {{ str_repeat('★', $item['rating']).str_repeat('☆', 5 - $item['rating']) }}
                    </div>
                    <blockquote style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">“{{ $item['body'] }}”</blockquote>
                    <figcaption style="margin-top: auto; display: flex; align-items: center; gap: 10px;">
                        <span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; background: {{ $brand }}; color: #ffffff; font-weight: 800; font-size: 14px;">{{ mb_strtoupper(mb_substr($item['author'], 0, 1)) }}</span>
                        <span>
                            <span style="display: block; font-size: 13px; font-weight: 700; color: #0f172a;">{{ $item['author'] }}</span>
                            @if (! empty($item['location']))
                                <span style="display: block; font-size: 11px; color: #94a3b8;">{{ $item['location'] }}</span>
                            @endif
                        </span>
                    </figcaption>
                </figure>
            @endforeach
        </div>
    </div>
</section>
