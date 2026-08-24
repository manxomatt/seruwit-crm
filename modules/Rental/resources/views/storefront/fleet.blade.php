@php
    $brand = 'var(--brand-primary, #0f766e)';
@endphp
<section style="padding: 48px 16px; background: #f8fafc;">
    <div style="max-width: 1120px; margin: 0 auto;">
        <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
            <div>
                <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: {{ $brand }};">Armada Kami</span>
                <h2 style="margin: 6px 0 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a;">Pilihan Kendaraan Siap Sewa</h2>
            </div>
            <a href="{{ $searchUrl }}"
               style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 12px; background: {{ $brand }}; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap;">
                Lihat Semua &amp; Cek Tanggal →
            </a>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
            @foreach ($cards as $card)
                <a href="{{ $card['url'] }}"
                   style="display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; text-decoration: none; color: inherit;">
                    <div style="aspect-ratio: 4 / 3; background: #eef2f5; overflow: hidden;">
                        @if (! empty($card['photo_url']))
                            <img src="{{ $card['photo_url'] }}" alt="{{ $card['name'] }}"
                                 style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
                        @else
                            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; font-weight: 600;">Tanpa Foto</div>
                        @endif
                    </div>
                    <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            @if (! empty($card['rental_class_label']))
                                <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: {{ $brand }}; background: rgba(15,118,110,0.08); padding: 2px 8px; border-radius: 999px;">{{ $card['rental_class_label'] }}</span>
                            @endif
                            @if (! empty($card['capacity_seats']))
                                <span style="font-size: 11px; font-weight: 600; color: #64748b;">{{ $card['capacity_seats'] }} kursi</span>
                            @endif
                        </div>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.3;">{{ $card['name'] }}</h3>
                        <div style="margin-top: auto;">
                            @if ($card['from_price'] !== null)
                                <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Mulai</span>
                                <div style="font-size: 17px; font-weight: 800; color: #0f172a;">Rp {{ number_format($card['from_price'], 0, ',', '.') }}<span style="font-size: 12px; font-weight: 600; color: #94a3b8;"> / hari</span></div>
                            @endif
                        </div>
                    </div>
                </a>
            @endforeach
        </div>
    </div>
</section>
