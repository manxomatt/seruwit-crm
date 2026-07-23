import CanvassingLayout from '@/Layouts/CanvassingLayout';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Partner { id: number; name: string; phone: string | null; address: string | null; }
interface Plan { id: number; plan_date: string; notes: string | null; }
interface Salesperson { id: number; name: string; }

interface Props { salesperson: Salesperson; partners: Partner[]; todayPlan: Plan | null; }

export default function CheckIn({ salesperson, partners, todayPlan }: Props): JSX.Element {
    const [search, setSearch] = useState('');
    const [gpsLoading, setGpsLoading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        partner_id: '',
        plan_id: todayPlan?.id?.toString() ?? '',
        latitude: '',
        longitude: '',
        notes: '',
    });

    useEffect(() => {
        setGpsLoading(true);
        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                setData((prev) => ({ ...prev, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
                setGpsLoading(false);
            },
            () => setGpsLoading(false),
            { timeout: 10000, enableHighAccuracy: true },
        );
    }, []);

    const filteredPartners = partners.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('module.canvassing.portal.checkin.store'));
    };

    return (
        <CanvassingLayout salespersonName={salesperson.name} title="Mulai Kunjungan" back={route('module.canvassing.portal.today')}>
            <Head title="Mulai Kunjungan" />

            <form onSubmit={submit} className="space-y-4">
                {/* GPS indicator */}
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${data.latitude ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {gpsLoading ? 'Mengambil lokasi GPS…' : data.latitude ? `GPS: ${parseFloat(data.latitude).toFixed(5)}, ${parseFloat(data.longitude).toFixed(5)}` : 'Lokasi GPS tidak tersedia'}
                </div>

                {/* Partner selection */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Pilih Pelanggan / Prospek *</label>
                    <input
                        type="text"
                        placeholder="Cari nama…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-2 w-full rounded-md border-gray-300 text-sm"
                    />
                    <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                        {filteredPartners.length === 0 && <p className="px-3 py-4 text-center text-sm text-gray-400">Tidak ditemukan</p>}
                        {filteredPartners.slice(0, 30).map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setData('partner_id', String(p.id))}
                                className={`w-full border-b border-gray-100 px-3 py-2 text-left last:border-0 ${data.partner_id === String(p.id) ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                            >
                                <p className={`text-sm font-medium ${data.partner_id === String(p.id) ? 'text-emerald-700' : 'text-gray-900'}`}>{p.name}</p>
                                {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                            </button>
                        ))}
                    </div>
                    <InputError message={errors.partner_id} className="mt-1" />
                </div>

                {/* Notes */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <label htmlFor="notes" className="mb-1 block text-sm font-semibold text-gray-700">Catatan (opsional)</label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder="Tujuan kunjungan, catatan awal…"
                        className="w-full rounded-md border-gray-300 text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing || !data.partner_id}
                    className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-md disabled:opacity-50 active:bg-emerald-700"
                >
                    {processing ? 'Memproses…' : 'Check In Sekarang'}
                </button>
            </form>
        </CanvassingLayout>
    );
}
